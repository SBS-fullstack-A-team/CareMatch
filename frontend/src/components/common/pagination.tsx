import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
}

/** 현재 페이지 주변 5개 + 앞뒤 이동 */
function getPageWindow(page: number, totalPages: number) {
  const size = Math.min(5, totalPages)
  let start = Math.max(1, page - 2)
  if (start + size - 1 > totalPages) start = totalPages - size + 1
  return Array.from({ length: size }, (_, index) => start + index)
}

export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = getPageWindow(page, totalPages)

  return (
    <nav aria-label="페이지 이동" className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="이전 페이지"
        className="grid size-11 place-items-center rounded-btn border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-40 disabled:hover:border-border"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          aria-current={item === page ? 'page' : undefined}
          className={cn(
            'size-11 rounded-btn border text-base font-bold transition-colors tabular',
            item === page
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
          )}
        >
          {item}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="다음 페이지"
        className="grid size-11 place-items-center rounded-btn border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-40 disabled:hover:border-border"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </nav>
  )
}
