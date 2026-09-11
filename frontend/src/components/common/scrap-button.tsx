import { Heart } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { addScrap, removeScrap } from '@/api/scraps'
import { useApp } from '@/hooks/use-app'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ScrapButtonProps {
  /** 대상 공고 id (숫자). */
  jobId: number
  /** 서버가 내려준 현재 찜 여부. 비로그인 응답은 null 이라 false 로 취급한다. */
  defaultScrapped?: boolean | null
  label?: string
  /** 아이콘 옆에 label 을 함께 노출한다 (상세 화면처럼 버튼 의미를 글자로 밝혀야 하는 곳) */
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 관심 공고 등록 버튼. `POST/DELETE /api/job-postings/{id}/scrap` 을 직접 호출한다.
 * 비로그인 상태로 누르면 저장 대신 로그인 화면으로 보낸다 (돌아올 위치를 state.from 에 담아).
 * 실패하면 눌렀던 상태를 되돌리고 토스트로 안내한다 (낙관적 업데이트 + 롤백).
 */
export function ScrapButton({
  jobId,
  defaultScrapped = false,
  label = '관심 공고',
  showLabel = false,
  size = 'sm',
  className,
}: ScrapButtonProps) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [scrapped, setScrapped] = useState(Boolean(defaultScrapped))
  const [pending, setPending] = useState(false)

  async function handleClick(event: MouseEvent) {
    event.stopPropagation()

    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    if (pending) return

    const next = !scrapped
    setScrapped(next)
    setPending(true)
    try {
      await (next ? addScrap(jobId) : removeScrap(jobId))
    } catch {
      setScrapped(!next)
      toast({ variant: 'error', title: '관심 공고 처리에 실패했습니다.', description: '잠시 후 다시 시도해 주세요.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      aria-pressed={scrapped}
      aria-label={scrapped ? `${label} 해제` : `${label} 등록`}
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'relative z-10 shrink-0 rounded-btn border transition-colors disabled:opacity-60',
        showLabel
          ? 'inline-flex items-center justify-center gap-2 px-5 text-base font-semibold'
          : 'grid place-items-center',
        showLabel || size === 'md' ? 'h-11' : 'size-9',
        !showLabel && (size === 'md' ? 'w-11' : ''),
        scrapped
          ? 'border-danger/40 bg-danger-light text-danger'
          : 'border-border bg-surface text-fg-subtle hover:border-border-strong hover:text-fg-muted',
        showLabel && !scrapped && 'text-fg-muted',
        className,
      )}
    >
      <Heart
        className={size === 'md' || showLabel ? 'size-5' : 'size-[18px]'}
        fill={scrapped ? 'currentColor' : 'none'}
        aria-hidden
      />
      {showLabel && <span>{label}</span>}
    </button>
  )
}
