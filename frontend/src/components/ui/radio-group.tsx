import { cn } from '@/lib/utils'

export interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  name: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  /** inline: 한 줄 나열 / card: 큰 선택 카드 */
  variant?: 'inline' | 'card'
  className?: string
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  variant = 'inline',
  className,
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      className={cn(
        variant === 'card' ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-wrap gap-x-6 gap-y-2',
        className,
      )}
    >
      {options.map((option) => {
        const checked = value === option.value
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-2.5 select-none',
              variant === 'card'
                ? cn(
                    'rounded-input border bg-surface px-4 py-3.5 transition-colors',
                    checked
                      ? 'border-primary bg-primary-light/60 ring-1 ring-primary'
                      : 'border-border-strong hover:border-primary/35',
                  )
                : 'min-h-11 items-center py-1',
            )}
          >
            <span className="relative flex size-5 shrink-0 items-center justify-center">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange?.(option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="size-5 rounded-full border border-border-strong bg-surface transition-colors peer-checked:border-[6px] peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1"
              />
            </span>
            <span>
              <span className="block text-base text-fg">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 block text-sm text-fg-muted">{option.description}</span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}
