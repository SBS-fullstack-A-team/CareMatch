import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** ex) "조건에 맞는 공고가 없습니다." */
  title: string
  /** ex) "검색 조건을 변경해보세요." */
  description?: string
  /** 필터 초기화 버튼 등 */
  action?: ReactNode
  className?: string
}

/** 데이터가 없을 때. 대형 일러스트를 사용하지 않는다. (COMPONENT_RULES.md §31) */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('px-6 py-16 text-center', className)}>
      <p className="text-lg font-bold text-fg">{title}</p>
      {description && <p className="mt-2 text-base text-fg-muted">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
