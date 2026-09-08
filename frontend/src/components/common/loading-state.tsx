import { cn } from '@/lib/utils'

/**
 * 목록 로딩 중 스켈레톤.
 * 스피너 대신 실제 카드/행의 형태를 유지해 레이아웃이 튀지 않게 한다.
 */
export function LoadingState({
  rows = 3,
  variant = 'list',
  className,
}: {
  rows?: number
  variant?: 'list' | 'card'
  className?: string
}) {
  return (
    <div
      className={cn(variant === 'card' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-4' : '', className)}
      role="status"
      aria-label="불러오는 중"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-surface',
            variant === 'card'
              ? 'rounded-card border border-border p-5'
              : 'border-b border-border px-5 py-5 last:border-b-0 sm:px-6',
          )}
        >
          <div className="h-6 w-20 rounded-badge bg-surface-sunken" />
          <div className="mt-3 h-6 w-3/4 rounded-input bg-surface-sunken" />
          <div className="mt-3 h-5 w-1/2 rounded-input bg-surface-sunken" />
          <div className="mt-4 h-6 w-32 rounded-input bg-surface-sunken" />
        </div>
      ))}
      <span className="sr-only">불러오는 중입니다.</span>
    </div>
  )
}
