import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
  invalid?: boolean
  selectSize?: 'md' | 'lg'
}

/**
 * 네이티브 select 기반.
 * 40~60대 사용자와 모바일 환경에서 OS 기본 피커가 가장 조작하기 쉽다.
 */
export function Select({
  className,
  options,
  placeholder,
  invalid,
  selectSize = 'md',
  value,
  ...props
}: SelectProps) {
  const isPlaceholder = placeholder !== undefined && (value === '' || value === undefined)

  return (
    <div className="relative">
      <select
        value={value}
        className={cn(
          'w-full appearance-none rounded-input border bg-surface pr-10 text-fg',
          'transition-colors outline-none',
          'focus:border-primary focus:shadow-focus',
          'disabled:bg-surface-sunken disabled:text-fg-subtle',
          selectSize === 'lg' ? 'h-14 pl-4 text-lg' : 'h-12 pl-4 text-base',
          invalid ? 'border-danger' : 'border-border-strong',
          isPlaceholder && 'text-fg-subtle',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled={props.required}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-fg">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-fg-muted"
        aria-hidden
      />
    </div>
  )
}
