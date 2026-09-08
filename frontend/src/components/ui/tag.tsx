import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagProps {
  children: React.ReactNode
  /** 값이 있으면 삭제 버튼이 붙는다 (필터 선택값 등) */
  onRemove?: () => void
  className?: string
}

/** 공고의 우대 조건·검색 필터 선택값처럼 나열되는 짧은 라벨 */
export function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-badge border border-border bg-surface px-2.5 text-sm text-fg-muted',
        onRemove && 'border-primary/35 bg-primary-light pr-1.5 text-primary-deep',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="grid size-5 place-items-center rounded-[4px] text-primary-deep/70 hover:bg-primary/15 hover:text-primary-deep"
          aria-label={`${typeof children === 'string' ? children : '선택'} 삭제`}
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}
