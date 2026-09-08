import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * DESIGN_SYSTEM.md §11
 * 최소 클릭 영역 44px / 주요 버튼 텍스트 16px, weight 500~600 / radius 8px
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-btn font-semibold whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-deep',
        /** 검색 버튼 등 Primary Deep 스타일 (§16) */
        primaryDeep: 'bg-primary-deep text-white hover:bg-primary',
        secondary:
          'border border-border-strong bg-surface text-fg hover:border-primary hover:text-primary-deep',
        /** 검색 보조 버튼 — Primary 톤의 Outline (§16) */
        outline:
          'border border-primary/40 bg-surface text-primary-deep hover:border-primary hover:bg-primary-light',
        accent: 'bg-accent text-white hover:bg-accent-deep',
        ghost: 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
        danger: 'bg-danger text-white hover:brightness-95',
        link: 'text-primary-deep underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-11 px-4 text-base [&_svg]:size-[18px]',
        md: 'h-12 px-5 text-base [&_svg]:size-5',
        lg: 'h-14 px-6 text-lg [&_svg]:size-5',
        icon: 'size-12 [&_svg]:size-5',
        iconSm: 'size-11 [&_svg]:size-[18px]',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, block, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  )
}

export { buttonVariants }
