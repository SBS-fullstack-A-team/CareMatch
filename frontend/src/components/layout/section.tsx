import type { ComponentType, ReactNode } from 'react'
import { SectionHeader } from '@/components/common/section-header'
import { cn } from '@/lib/utils'

interface SectionProps {
  title: ReactNode
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  description?: ReactNode
  moreHref?: string
  moreLabel?: string
  action?: ReactNode
  /**
   * default: 페이지 배경 위에 그대로
   * tinted: Primary Light 계열 배경 영역 (스페셜 채용정보, DESIGN_SYSTEM.md §19)
   */
  tone?: 'default' | 'tinted'
  children: ReactNode
  className?: string
}

/**
 * 섹션 간 간격과 제목 스타일을 화면마다 다시 정의하지 않기 위한 래퍼.
 * (COMPONENT_RULES.md §36 / DESIGN_SYSTEM.md §5)
 */
export function Section({
  title,
  icon,
  description,
  moreHref,
  moreLabel,
  action,
  tone = 'default',
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={cn(
        'mt-10 lg:mt-12',
        tone === 'tinted' && 'rounded-card bg-primary-light/60 p-4 sm:p-6 lg:p-8',
        className,
      )}
    >
      <SectionHeader
        title={title}
        icon={icon}
        description={description}
        moreHref={moreHref}
        moreLabel={moreLabel}
        action={action}
      />
      <div className="mt-5">{children}</div>
    </section>
  )
}
