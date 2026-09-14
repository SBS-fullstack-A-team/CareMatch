import { Check } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { applyToJobPosting } from '@/api/applications'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/hooks/use-app'
import { ApiError } from '@/lib/api-client'

interface JobApplyButtonProps {
  jobId: string
  size?: ButtonProps['size']
  block?: boolean
  className?: string
}

/**
 * 공고 상세의 "온라인으로 지원하기" 버튼. `POST /api/job-postings/{id}/applications` 를 직접 호출한다.
 * - 비로그인: 로그인 화면으로 보낸다 (돌아올 위치를 state.from 에 담아, ScrapButton과 동일한 패턴).
 * - 구직회원이 아니면: 클릭 시 안내만 하고 API 호출은 하지 않는다.
 * - 구직 프로필이 아직 없으면(서버가 COMMON_002로 거절): 구직신청서 작성 화면으로 보낸다.
 * - 이미 지원한 공고(APPLICATION_002)면 성공과 동일하게 "지원완료" 상태로 표시한다.
 */
export function JobApplyButton({ jobId, size = 'md', block, className }: JobApplyButtonProps) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [applied, setApplied] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    if (user.role !== 'JOBSEEKER') {
      toast({ variant: 'error', title: '구직회원만 지원할 수 있습니다.' })
      return
    }
    if (pending || applied) return

    setPending(true)
    try {
      await applyToJobPosting(Number(jobId))
      setApplied(true)
      toast({
        title: '지원이 완료되었습니다.',
        description: '마이페이지 › 지원 현황에서 진행 상황을 확인할 수 있습니다.',
      })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'APPLICATION_002') {
        // 이미 지원한 공고 — 실패가 아니라 현재 상태를 알려준 것이므로 버튼도 완료 상태로 맞춘다
        setApplied(true)
        toast({ variant: 'info', title: err.message })
      } else if (err instanceof ApiError && err.code === 'COMMON_002') {
        toast({
          variant: 'error',
          title: '구직 프로필을 먼저 등록해 주세요.',
          description: '지원하려면 구직신청서 작성이 필요합니다.',
        })
        navigate(`/apply?jobId=${jobId}`)
      } else {
        const message = err instanceof ApiError ? err.message : '지원에 실패했습니다.'
        toast({ variant: 'error', title: message, description: '잠시 후 다시 시도해 주세요.' })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="primary"
      size={size}
      block={block}
      disabled={pending || applied}
      onClick={handleClick}
      className={className}
    >
      {applied && <Check aria-hidden />}
      {applied ? '지원완료' : '온라인으로 지원하기'}
    </Button>
  )
}
