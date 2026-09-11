import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { SelectOption } from '@/components/ui/select'
import {
  CATEGORY_OPTIONS,
  FACILITY_TYPE_OPTIONS,
  PAY_TYPE_OPTIONS,
  REGION_SHORTCUTS,
  WORK_SCHEDULE_OPTIONS,
} from '@/data/filters'
import type { JobFilterGroup, JobFilterState } from '@/lib/job-filters'
import { cn, formatNumber } from '@/lib/utils'

/** 좌측 필터 (COMPONENT_RULES.md §17) */
const REGION_OPTIONS: SelectOption[] = REGION_SHORTCUTS.map((region) => ({
  value: region.label,
  label: region.label,
}))

/** 지역은 17개를 한 번에 펼치지 않고 주요 지역 + 더보기로 나눈다 */
const REGION_VISIBLE_COUNT = 8

/** 그룹별 옵션 결과 건수. 자기 그룹의 선택은 제외하고 센 값이라 다른 항목을 추가로 켜도 0으로 사라지지 않는다. */
export interface JobFilterCounts {
  regions: Record<string, number>
  categories: Record<string, number>
  facilityTypes: Record<string, number>
  workSchedules: Record<string, number>
  payTypes: Record<string, number>
}

export const EMPTY_JOB_FILTER_COUNTS: JobFilterCounts = {
  regions: {},
  categories: {},
  facilityTypes: {},
  workSchedules: {},
  payTypes: {},
}

interface JobFilterPanelProps {
  value: JobFilterState
  onChange: (next: JobFilterState) => void
  /** `GET /api/job-postings/facets` 응답을 옮긴 옵션별 결과 건수 */
  counts: JobFilterCounts
  onReset: () => void
  className?: string
}

export function JobFilterPanel({ value, onChange, counts, onReset, className }: JobFilterPanelProps) {
  const [regionExpanded, setRegionExpanded] = useState(false)

  const toggle = (group: JobFilterGroup, option: string) => {
    const current = value[group]
    onChange({
      ...value,
      [group]: current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    })
  }

  const hasSelection = Object.values(value).some((group) => group.length > 0)

  const regionOptions = regionExpanded
    ? REGION_OPTIONS
    : REGION_OPTIONS.slice(0, REGION_VISIBLE_COUNT)

  return (
    <aside className={cn('rounded-card border border-border bg-surface', className)}>
      <h2 className="border-b border-border px-5 py-4 text-lg font-bold text-fg">상세 필터</h2>

      <FilterGroup title="지역">
        <div className="grid grid-cols-2 gap-x-3">
          {regionOptions.map((option) => (
            <FilterCheckbox
              key={option.value}
              option={option}
              group="regions"
              value={value}
              counts={counts.regions}
              onToggle={toggle}
            />
          ))}
        </div>
        {REGION_OPTIONS.length > REGION_VISIBLE_COUNT && (
          <button
            type="button"
            onClick={() => setRegionExpanded((prev) => !prev)}
            aria-expanded={regionExpanded}
            className="mt-1 inline-flex h-11 items-center gap-1 text-base text-fg-muted hover:text-primary-deep"
          >
            {regionExpanded
              ? '지역 접기'
              : `지역 더보기 (${REGION_OPTIONS.length - REGION_VISIBLE_COUNT})`}
            <ChevronDown
              className={cn('size-[18px] transition-transform', regionExpanded && 'rotate-180')}
              aria-hidden
            />
          </button>
        )}
      </FilterGroup>

      <FilterGroup title="직종">
        {CATEGORY_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            option={option}
            group="categories"
            value={value}
            counts={counts.categories}
            onToggle={toggle}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="시설유형">
        {FACILITY_TYPE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            option={option}
            group="facilityTypes"
            value={value}
            counts={counts.facilityTypes}
            onToggle={toggle}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="근무 시간대">
        {WORK_SCHEDULE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            option={option}
            group="workSchedules"
            value={value}
            counts={counts.workSchedules}
            onToggle={toggle}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="급여">
        {PAY_TYPE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            option={option}
            group="payTypes"
            value={value}
            counts={counts.payTypes}
            onToggle={toggle}
          />
        ))}
      </FilterGroup>

      <div className="border-t border-border p-4">
        <Button variant="secondary" size="sm" block onClick={onReset} disabled={!hasSelection}>
          필터 초기화
        </Button>
      </div>
    </aside>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border px-5 py-4">
      <h3 className="mb-1 text-base font-bold text-fg">{title}</h3>
      {children}
    </section>
  )
}

function FilterCheckbox({
  option,
  group,
  value,
  counts,
  onToggle,
}: {
  option: SelectOption
  group: JobFilterGroup
  value: JobFilterState
  counts: Record<string, number>
  onToggle: (group: JobFilterGroup, option: string) => void
}) {
  const count = counts[option.value] ?? 0
  return (
    <Checkbox
      label={option.label}
      hint={formatNumber(count)}
      checked={value[group].includes(option.value)}
      onChange={() => onToggle(group, option.value)}
    />
  )
}
