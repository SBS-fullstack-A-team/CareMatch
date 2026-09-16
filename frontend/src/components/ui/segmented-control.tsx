import { cn } from '@/lib/utils'

export interface SegmentedItem<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedControlProps<T extends string> {
  items: SegmentedItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'md' | 'lg'
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    // 항목 수가 많아 폭을 넘어가도(FAQ 카테고리 등 동적 목록) 페이지가 가로로
    // 밀리지 않도록, 넘치는 폭만 이 영역 안에서 가로 스크롤로 흡수한다.
    <div className={cn('max-w-full overflow-x-auto no-scrollbar', className)}>
      <div
        role="tablist"
        className="inline-flex w-max rounded-input border border-border bg-surface-sunken p-1"
      >
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                'shrink-0 rounded-[6px] font-bold whitespace-nowrap transition-colors',
                size === 'lg' ? 'h-11 px-5 text-base' : 'h-9 px-4 text-base',
                active
                  ? 'bg-surface text-primary-deep shadow-card'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className={cn('ml-1.5 tabular', active ? 'text-primary' : 'text-fg-subtle')}>
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
