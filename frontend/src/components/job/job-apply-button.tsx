import { Check } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { JobApplyModal } from '@/components/job/job-apply-modal'
import { useApp } from '@/hooks/use-app'

interface JobApplyButtonProps {
  jobId: string
  size?: ButtonProps['size']
  block?: boolean
  className?: string
}

/**
 * 공고 상세의 "온라인으로 지원하기" 버튼. 클릭하면 지원 확인 모달(JobApplyModal)을 띄운다 —
 * 실제 `POST /api/job-postings/{id}/applications` 호출은 모달 쪽에서 처리한다.
 * - 비로그인: 로그인 화면으로 보낸다 (돌아올 위치를 state.from 에 담아, ScrapButton과 동일한 패턴).
 * - 구직회원이 아니면: 클릭 시 안내만 하고 모달은 열지 않는다.
 */
export function JobApplyButton({ jobId, size = 'md', block, className }: JobApplyButtonProps) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [applied, setApplied] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  function handleClick() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    if (user.role !== 'JOBSEEKER') {
      toast({ variant: 'error', title: '구직회원만 지원할 수 있습니다.' })
      return
    }
    if (applied) return
    setModalOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size={size}
        block={block}
        disabled={applied}
        onClick={handleClick}
        className={className}
      >
        {applied && <Check aria-hidden />}
        {applied ? '지원완료' : '온라인으로 지원하기'}
      </Button>

      <JobApplyModal
        jobId={jobId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApplied={() => setApplied(true)}
      />
    </>
  )
}
