import { Check } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  /** 우측 보조 텍스트 (ex. 결과 건수) */
  hint?: ReactNode
}

export function Checkbox({ label, hint, className, ...props }: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2.5 py-1 select-none',
        props.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span
          aria-hidden
          className="size-5 rounded-[5px] border border-border-strong bg-surface transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1"
        />
        <Check
          aria-hidden
          className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100"
          strokeWidth={3}
        />
      </span>
      <span className="flex-1 text-base text-fg">{label}</span>
      {hint && <span className="text-sm text-fg-subtle tabular">{hint}</span>}
    </label>
  )
}
