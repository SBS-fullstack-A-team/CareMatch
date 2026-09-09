import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  /** 없으면 현재 위치로 보고 링크를 걸지 않는다 */
  to?: string
}

/** 상세 화면 상단 경로 표시. 마지막 항목이 현재 페이지다. */
export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="현재 위치" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-fg-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-primary-deep hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast && 'text-fg')} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-4 text-fg-subtle" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
