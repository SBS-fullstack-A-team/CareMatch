import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DetailSectionProps {
  title: string
  /** 제목 왼쪽 아이콘 (Lucide) */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  children: ReactNode
  className?: string
}

/**
 * 상세 화면의 본문 섹션 한 덩어리.
 * 메인의 Section(페이지 단위 섹션, 24px 제목)과 달리 카드 안에서 20px 제목을 쓴다.
 * 섹션마다 명확한 heading 을 둔다. (COMPONENT_RULES.md §22)
 */
export function DetailSection({ title, icon: Icon, children, className }: DetailSectionProps) {
  return (
    <section className={cn('rounded-card border border-border bg-surface p-6 lg:p-8', className)}>
      <h2 className="flex items-center gap-2 text-xl font-bold text-fg">
        {Icon && <Icon className="size-5 shrink-0 text-primary-deep" aria-hidden />}
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/**
 * 라벨 / 값 한 줄. 근무조건·시설정보처럼 항목이 나열되는 곳에서 쓴다.
 * 값이 없으면 행 자체를 렌더링하지 않아 빈 항목이 남지 않는다.
 */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  if (children === undefined || children === null || children === false) return null
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="w-[104px] shrink-0 text-base text-fg-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-base text-fg">{children}</dd>
    </div>
  )
}
