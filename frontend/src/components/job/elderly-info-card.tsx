import { Activity, Brain, CalendarDays, Footprints, UserRound, Utensils } from 'lucide-react'
import type { ComponentType } from 'react'
import { Tag } from '@/components/ui/tag'
import { cn } from '@/lib/utils'
import type { ElderlyInfo } from '@/types'

interface Item {
  label: string
  value?: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

/**
 * 어르신 정보 (COMPONENT_RULES.md §23)
 * 방문요양·간병처럼 담당 어르신이 특정되는 공고에만 데이터가 존재하므로,
 * 값이 없는 항목은 렌더링하지 않는다.
 */
export function ElderlyInfoCard({
  elderly,
  className,
}: {
  elderly: ElderlyInfo
  className?: string
}) {
  const items: Item[] = [
    { label: '장기요양등급', value: elderly.grade, icon: Activity },
    { label: '성별', value: elderly.gender, icon: UserRound },
    { label: '연령', value: elderly.ageGroup, icon: CalendarDays },
    { label: '거동', value: elderly.mobility, icon: Footprints },
    { label: '식사', value: elderly.meal, icon: Utensils },
    { label: '인지 상태', value: elderly.cognition, icon: Brain },
  ]

  return (
    <div className={className}>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {items
          .filter((item) => item.value)
          .map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[8px] bg-primary-light text-primary-deep"
              >
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <dt className="text-sm text-fg-muted">{label}</dt>
                <dd className="text-base font-semibold text-fg">{value}</dd>
              </div>
            </div>
          ))}
      </dl>

      {elderly.careTasks && elderly.careTasks.length > 0 && (
        <div className={cn('mt-6 border-t border-border pt-5')}>
          <p className="text-sm text-fg-muted">주요 업무 항목</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {elderly.careTasks.map((task) => (
              <li key={task}>
                <Tag>{task}</Tag>
              </li>
            ))}
          </ul>
        </div>
      )}

      {elderly.note && (
        <p className="mt-5 rounded-card bg-surface-sunken px-4 py-3 text-base text-fg-muted">
          {elderly.note}
        </p>
      )}
    </div>
  )
}
