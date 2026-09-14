import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { SelectOption } from '@/components/ui/select'
import {
  CAREER_OPTIONS,
  CATEGORY_OPTIONS,
  CERTIFICATE_OPTIONS,
  REGION_SHORTCUTS,
  WORK_SCHEDULE_OPTIONS,
} from '@/data/filters'
import type { TalentFilterGroup, TalentFilterState } from '@/lib/talent-filters'
import { cn, formatNumber } from '@/lib/utils'

/** 좌측 필터 (COMPONENT_RULES.md §17) — 구인공고 필터 패널과 같은 레이아웃 언어를 쓴다 */
const REGION_OPTIONS: SelectOption[] = REGION_SHORTCUTS.map((region) => ({
  value: region.label,
  label: region.label,
}))

/** 지역은 17개를 한 번에 펼치지 않고 주요 지역 + 더보기로 나눈다 */
const REGION_VISIBLE_COUNT = 8

/**
 * 그룹별 옵션 결과 인원수. `GET /api/jobseekers/facets` 응답을 옮긴 것이라
 * 자격증(certificates) 축은 서버가 제공하지 않아 항상 빈 값이다 — 체크박스는 그대로 동작하고
 * 옆 숫자만 비어 있다 (백엔드 Certificate 조인 집계가 이번 범위 밖).
 */
export interface TalentFilterCounts {
  regions: Record<string, number>
  categories: Record<string, number>
  workSchedules: Record<string, number>
  careers: Record<string, number>
  certificates: Record<string, number>
}

export const EMPTY_TALENT_FILTER_COUNTS: TalentFilterCounts = {
  regions: {},
  categories: {},
  workSchedules: {},
  careers: {},
  certificates: {},
}

interface TalentFilterPanelProps {
  value: TalentFilterState
  onChange: (next: TalentFilterState) => void
  /** `GET /api/jobseekers/facets` 응답을 옮긴 옵션별 결과 인원수 */
  counts: TalentFilterCounts
  onReset: () => void
  className?: string
}

export function TalentFilterPanel({
  value,
  onChange,
  counts,
  onReset,
  className,
}: TalentFilterPanelProps) {
  const [regionExpanded, setRegionExpanded] = useState(false)

  const toggle = (group: TalentFilterGroup, option: string) => {
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

      <FilterGroup title="희망지역">
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

      <FilterGroup title="희망직종">
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

      <FilterGroup title="경력">
        {CAREER_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            option={option}
            group="careers"
            value={value}
            counts={counts.careers}
            onToggle={toggle}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="자격증">
        {CERTIFICATE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            option={option}
            group="certificates"
            value={value}
            counts={counts.certificates}
            onToggle={toggle}
          />
        ))}
      </FilterGroup>

      <div className="border-t border-border p-4">
        <Button variant="secondary" size="sm" block onClick={onReset} disabled={!hasSelection}>
          전체 초기화
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
  group: TalentFilterGroup
  value: TalentFilterState
  counts: Record<string, number>
  onToggle: (group: TalentFilterGroup, option: string) => void
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
