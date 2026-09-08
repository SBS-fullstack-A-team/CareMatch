import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * DESIGN_SYSTEM.md §14
 * font-size 14px / font-weight 500~600 / radius 6px
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-badge font-semibold whitespace-nowrap [&_svg]:size-4',
  {
    variants: {
      variant: {
        /** 스페셜 — #B9612F 배경 / 흰 글씨 */
        special: 'bg-accent text-white',
        /** 프리미엄 — 흰 배경 / #B9612F 테두리·글씨 */
        premium: 'border border-accent bg-surface text-accent',
        /** 새글 — #2C7A68 배경 / 흰 글씨 */
        new: 'bg-primary text-white',
        /** 일반 — #EAF5F2 배경 / #2C7A68 글씨 */
        normal: 'bg-primary-light text-primary',
        /** 마감임박 — #C94A4A 배경 / 흰 글씨 */
        closing: 'bg-danger text-white',

        /** 중립 정보 (시설유형 등) */
        neutral: 'bg-surface-sunken text-fg-muted',
        neutralOutline: 'border border-border bg-surface text-fg-muted',
        primaryOutline: 'border border-primary/35 bg-surface text-primary-deep',
      },
      size: {
        sm: 'h-7 px-2.5 text-sm',
        md: 'h-8 px-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { badgeVariants }
