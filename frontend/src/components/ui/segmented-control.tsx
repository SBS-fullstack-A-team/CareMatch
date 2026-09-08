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
    <div
      role="tablist"
      className={cn(
        'inline-flex rounded-input border border-border bg-surface-sunken p-1',
        className,
      )}
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
              'rounded-[6px] font-bold transition-colors',
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
  )
}
