import { Search } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  CATEGORY_OPTIONS,
  DISTRICT_OPTIONS,
  SIDO_OPTIONS,
  WORK_TYPE_OPTIONS,
} from '@/data/filters'
import { EMPTY_TALENT_SEARCH, type TalentSearchQuery } from '@/lib/talent-filters'
import { cn } from '@/lib/utils'

/**
 * 인재 검색 패널.
 *
 * JobSearchBar 와 같은 디자인 언어(48px 필드 · 상단 Label · Primary Deep 검색 버튼)를 쓰지만,
 * 네 번째 필드가 시설유형이 아니라 근무형태라 필드 구성이 다르다.
 * JobSearchBar 를 일반화하면 구인공고 화면에 영향이 가므로 Talent 전용으로 분리했다.
 * (COMPONENT_RULES.md §16 / DESIGN_SYSTEM.md §12)
 */
export function TalentSearchBar({
  defaultValues,
  onSearch,
  className,
}: {
  defaultValues?: Partial<TalentSearchQuery>
  onSearch: (values: TalentSearchQuery) => void
  className?: string
}) {
  const id = useId()
  const [values, setValues] = useState<TalentSearchQuery>({
    ...EMPTY_TALENT_SEARCH,
    ...defaultValues,
  })

  const districts = DISTRICT_OPTIONS[values.sido] ?? []

  const update = (patch: Partial<TalentSearchQuery>) =>
    setValues((prev) => ({ ...prev, ...patch }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSearch(values)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn('rounded-card border border-border bg-surface p-5 lg:p-6', className)}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.5fr)_auto]">
        <Field id={`${id}-sido`} label="지역">
          <Select
            id={`${id}-sido`}
            placeholder="지역 선택"
            options={SIDO_OPTIONS}
            value={values.sido}
            onChange={(event) => update({ sido: event.target.value, district: '' })}
          />
        </Field>

        <Field id={`${id}-district`} label="구·군">
          <Select
            id={`${id}-district`}
            placeholder={values.sido ? '구·군 선택' : '지역 먼저 선택'}
            options={districts}
            value={values.district}
            disabled={districts.length === 0}
            onChange={(event) => update({ district: event.target.value })}
          />
        </Field>

        <Field id={`${id}-category`} label="희망직종">
          <Select
            id={`${id}-category`}
            placeholder="직종 전체"
            options={CATEGORY_OPTIONS}
            value={values.category}
            onChange={(event) => update({ category: event.target.value })}
          />
        </Field>

        <Field id={`${id}-work-type`} label="근무형태">
          <Select
            id={`${id}-work-type`}
            placeholder="근무형태 전체"
            options={WORK_TYPE_OPTIONS}
            value={values.workType}
            onChange={(event) => update({ workType: event.target.value })}
          />
        </Field>

        <Field id={`${id}-keyword`} label="키워드를 입력하세요">
          <Input
            id={`${id}-keyword`}
            placeholder="예) 자격증, 치매전문교육"
            value={values.keyword}
            onChange={(event) => update({ keyword: event.target.value })}
          />
        </Field>

        <div className="self-end">
          <Button type="submit" variant="primaryDeep" block className="lg:w-[120px]">
            <Search aria-hidden />
            검색
          </Button>
        </div>
      </div>
    </form>
  )
}

/** 검색 필드 라벨은 숨기지 않는다 (DESIGN_SYSTEM.md §12) */
function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  )
}
