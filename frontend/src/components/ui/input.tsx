import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 좌측 아이콘 (Lucide) */
  icon?: ReactNode
  invalid?: boolean
  inputSize?: 'md' | 'lg'
}

export function Input({
  className,
  icon,
  invalid,
  inputSize = 'md',
  ...props
}: InputProps) {
  const field = (
    <input
      className={cn(
        'w-full rounded-input border bg-surface text-fg placeholder:text-fg-subtle',
        'transition-colors outline-none',
        'focus:border-primary focus:shadow-focus',
        'disabled:bg-surface-sunken disabled:text-fg-subtle',
        inputSize === 'lg' ? 'h-14 px-4 text-lg' : 'h-12 px-4 text-base',
        invalid ? 'border-danger' : 'border-border-strong',
        icon && (inputSize === 'lg' ? 'pl-12' : 'pl-11'),
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )

  if (!icon) return field

  return (
    <div className="relative">
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-fg-subtle',
          inputSize === 'lg' ? 'left-4' : 'left-3.5',
        )}
      >
        {icon}
      </span>
      {field}
    </div>
  )
}
