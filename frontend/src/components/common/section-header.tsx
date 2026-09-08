import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: ReactNode
  /** 제목 왼쪽 아이콘 (Lucide) */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  /** 제목 오른쪽에 인라인으로 붙는 짧은 설명 (DESIGN_SYSTEM.md §18) */
  description?: ReactNode
  /** 우측 "더보기" 링크 */
  moreHref?: string
  moreLabel?: string
  /** 우측 커스텀 영역 */
  action?: ReactNode
  as?: 'h2' | 'h3'
  className?: string
}

export function SectionHeader({
  title,
  icon: Icon,
  description,
  moreHref,
  moreLabel = '더보기',
  action,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2', className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Heading className="flex items-center gap-2 text-2xl font-bold text-fg">
          {Icon && <Icon className="size-6 shrink-0 text-primary-deep" aria-hidden />}
          {title}
        </Heading>
        {description && <p className="text-base text-fg-muted">{description}</p>}
      </div>

      {action ??
        (moreHref && (
          <Link
            to={moreHref}
            className="inline-flex items-center gap-0.5 text-base text-fg-muted hover:text-primary-deep"
          >
            {moreLabel}
            <ChevronRight className="size-[18px]" aria-hidden />
          </Link>
        ))}
    </div>
  )
}
