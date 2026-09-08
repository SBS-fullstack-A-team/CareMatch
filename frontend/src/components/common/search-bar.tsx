import { Bell, MapPin, Search } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  CATEGORY_OPTIONS,
  DISTRICT_OPTIONS,
  FACILITY_TYPE_OPTIONS,
  SIDO_OPTIONS,
} from '@/data/filters'
import { cn } from '@/lib/utils'

export interface SearchValues {
  sido: string
  district: string
  category: string
  facilityType: string
  keyword: string
}

const EMPTY_VALUES: SearchValues = {
  sido: '',
  district: '',
  category: '',
  facilityType: '',
  keyword: '',
}

/**
 * 메인 검색 패널 (DESIGN_SYSTEM.md §16)
 * Hero 와 분리된 별도 패널이며, 5개 필드 모두 상단 Label 을 노출한다.
 */
export function JobSearchBar({
  defaultValues,
  onSearch,
  className,
}: {
  defaultValues?: Partial<SearchValues>
  onSearch?: (values: SearchValues) => void
  className?: string
}) {
  const navigate = useNavigate()
  const id = useId()
  const [values, setValues] = useState<SearchValues>({ ...EMPTY_VALUES, ...defaultValues })

  const districts = DISTRICT_OPTIONS[values.sido] ?? []

  const update = (patch: Partial<SearchValues>) =>
    setValues((prev) => ({ ...prev, ...patch }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (onSearch) {
      onSearch(values)
      return
    }
    const params = new URLSearchParams()
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    navigate(`/jobs?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn('rounded-card border border-border bg-surface p-5 lg:p-6', className)}
    >
      <div className="lg:flex lg:gap-8">
        <p className="shrink-0 text-xl leading-snug font-bold text-fg lg:w-[152px] lg:self-center">
          원하는 일자리를
          <br className="hidden lg:block" /> 찾아보세요
        </p>

        <div className="mt-4 min-w-0 flex-1 lg:mt-0">
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

            <Field id={`${id}-category`} label="직종">
              <Select
                id={`${id}-category`}
                placeholder="직종 전체"
                options={CATEGORY_OPTIONS}
                value={values.category}
                onChange={(event) => update({ category: event.target.value })}
              />
            </Field>

            <Field id={`${id}-facility`} label="시설유형">
              <Select
                id={`${id}-facility`}
                placeholder="시설유형 전체"
                options={FACILITY_TYPE_OPTIONS}
                value={values.facilityType}
                onChange={(event) => update({ facilityType: event.target.value })}
              />
            </Field>

            <Field id={`${id}-keyword`} label="키워드를 입력하세요">
              <Input
                id={`${id}-keyword`}
                placeholder="예) 주간보호, 경력무관"
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

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link to="/nearby" className={cn(buttonVariants({ variant: 'outline', block: true }))}>
              <MapPin aria-hidden />
              내 주변 일자리 찾기
            </Link>
            <Link
              to="/mypage/alerts"
              className={cn(buttonVariants({ variant: 'outline', block: true }))}
            >
              <Bell aria-hidden />
              구인공고 알림받기
            </Link>
          </div>
        </div>
      </div>
    </form>
  )
}

/** 검색 필드 라벨은 숨기지 않는다 (DESIGN_SYSTEM.md §12) */
function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  )
}
