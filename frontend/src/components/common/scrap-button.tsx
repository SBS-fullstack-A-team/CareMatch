import { Heart } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ScrapButtonProps {
  /** 초기 관심 등록 여부 */
  defaultScrapped?: boolean
  label?: string
  /** 아이콘 옆에 label 을 함께 노출한다 (상세 화면처럼 버튼 의미를 글자로 밝혀야 하는 곳) */
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** 관심 공고/관심 인재 등록 버튼. 카드 안에서 링크 위에 겹쳐 놓기 위해 z-index 를 갖는다. */
export function ScrapButton({
  defaultScrapped = false,
  label = '관심 공고',
  showLabel = false,
  size = 'sm',
  className,
}: ScrapButtonProps) {
  const [scrapped, setScrapped] = useState(defaultScrapped)

  return (
    <button
      type="button"
      aria-pressed={scrapped}
      aria-label={scrapped ? `${label} 해제` : `${label} 등록`}
      onClick={(event) => {
        event.stopPropagation()
        setScrapped((prev) => !prev)
      }}
      className={cn(
        'relative z-10 shrink-0 rounded-btn border transition-colors',
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
