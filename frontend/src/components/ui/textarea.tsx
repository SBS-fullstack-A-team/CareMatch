import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function Textarea({ className, invalid, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full rounded-input border bg-surface px-3.5 py-3 text-base text-fg',
        'placeholder:text-fg-subtle transition-colors outline-none',
        'focus:border-primary focus:shadow-focus',
        invalid ? 'border-danger' : 'border-border-strong',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}
