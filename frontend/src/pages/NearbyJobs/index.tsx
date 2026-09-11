import { MapPin } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { JobSearchBar, type SearchValues } from '@/components/common/search-bar'
import { EMPTY_JOB_FILTER_COUNTS, JobFilterPanel, type JobFilterCounts } from '@/components/job/job-filter-panel'
import { JobListItem } from '@/components/job/job-list-item'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Tag } from '@/components/ui/tag'
import { getJobPostingFacets, getJobPostings } from '@/api/job-postings'
import {
  CATEGORY_OPTIONS,
  FACILITY_TYPE_OPTIONS,
  JOB_SORT_OPTIONS,
  PAY_TYPE_OPTIONS,
  WORK_SCHEDULE_OPTIONS,
} from '@/data/filters'
import { payTypeFromApi } from '@/data/labels'
import { useAsync } from '@/hooks/use-async'
import { summaryToJob } from '@/lib/job-adapter'
import {
  EMPTY_JOB_FILTERS,
  EMPTY_JOB_SEARCH,
  isJobSort,
  toRegionLabel,
  toSearchParams,
  type JobFilterGroup,
  type JobFilterState,
  type JobSearchQuery,
  type JobSort,
} from '@/lib/job-filters'
import { formatNumber } from '@/lib/utils'
import { LoadFailed } from '@/pages/Support/shared'
import type { JobFacetsResponse } from '@/types/api'

const PAGE_SIZE = 10

const SEARCH_FIELD_LABEL: Record<keyof JobSearchQuery, string> = {
  sido: '지역',
  district: '구·군',
  category: '직종',
  facilityType: '시설유형',
  keyword: '키워드',
}

/** 값(CAREGIVER, hourly)과 표기 라벨(요양보호사, 시급)이 다른 필터의 칩 표기용 라벨 */
const FILTER_VALUE_LABEL = Object.fromEntries(
  [
    ...PAY_TYPE_OPTIONS,
    ...CATEGORY_OPTIONS,
    ...FACILITY_TYPE_OPTIONS,
    ...WORK_SCHEDULE_OPTIONS,
  ].map((option) => [option.value, option.label]),
) as Record<string, string>

function readSearch(params: URLSearchParams): JobSearchQuery {
  return {
    sido: params.get('sido') ?? '',
    district: params.get('district') ?? '',
    category: params.get('category') ?? '',
    facilityType: params.get('facilityType') ?? '',
    keyword: params.get('keyword') ?? '',
  }
}

function toParams(search: JobSearchQuery, sort: JobSort) {
  const params = new URLSearchParams()
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  if (sort !== 'latest') params.set('sort', sort)
  return params
}

/** `GET /api/job-postings/facets` 응답을 좌측 필터 패널이 쓰는 형태로 옮긴다. (JobList 와 동일) */
function toFilterCounts(facets: JobFacetsResponse | null): JobFilterCounts {
  if (!facets) return EMPTY_JOB_FILTER_COUNTS
  return {
    regions: Object.fromEntries(
      Object.entries(facets.sido).map(([sido, count]) => [toRegionLabel(sido), count]),
    ),
    categories: facets.jobType,
    facilityTypes: facets.facilityType,
    workSchedules: facets.workSchedule,
    payTypes: Object.fromEntries(
      Object.entries(facets.payType).map(([payType, count]) => [payTypeFromApi(payType), count]),
    ),
  }
}

/**
 * 내 주변 일자리 (/nearby)
 *
 * 프로젝트에 Geolocation·지도 SDK·좌표 데이터·거리 계산이 전혀 없으므로
 * "내 주변"은 **사용자가 직접 고른 지역**을 기준으로 처리한다.
 * GPS·지도·거리 표기·거리순 정렬은 만들지 않는다 — 백엔드 `GET /api/job-postings/nearby` 는
 * lat/lng 가 필수라 이 화면과 맞지 않고, 구인공고 목록과 같은 `GET /api/job-postings`(sido/sigungu) 를 쓴다.
 *
 * 구인공고 목록(/jobs)과 같은 컴포넌트와 필터 규칙을 그대로 쓰고,
 * 지역 기준 안내 영역과 "OO 주변 일자리" 결과 문구로 페이지 목적을 구분한다.
 */
export function NearbyJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  /** [지역 변경] 에서 검색 패널의 지역 필드로 이동하기 위한 참조 */
  const searchRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState<JobSearchQuery>(() => readSearch(searchParams))
  /** 칩 삭제·초기화로 검색값이 바뀌면 검색 패널을 다시 그려 값을 맞춘다 */
  const [searchFormKey, setSearchFormKey] = useState(0)
  const [filters, setFilters] = useState<JobFilterState>(EMPTY_JOB_FILTERS)
  const [sort, setSort] = useState<JobSort>(() => {
    const value = searchParams.get('sort')
    return isJobSort(value) ? value : 'latest'
  })
  const [page, setPage] = useState(1)

  const params = useMemo(() => toSearchParams(search, filters, sort), [search, filters, sort])

  const { data, loading, error, reload } = useAsync(
    () => getJobPostings({ ...params, page: page - 1, size: PAGE_SIZE }),
    [params, page],
  )
  const { data: facets } = useAsync(() => getJobPostingFacets(params), [params])

  const jobs = useMemo(() => (data?.content ?? []).map(summaryToJob), [data])
  const totalElements = data?.totalElements ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const counts = useMemo(() => toFilterCounts(facets ?? null), [facets])

  const hasSearch = Object.values(search).some(Boolean)
  const hasFilters = Object.values(filters).some((group) => group.length > 0)
  const hasCondition = hasSearch || hasFilters

  /** 검색 패널의 지역 선택을 우선하고, 없으면 좌측 필터의 지역 선택을 쓴다 */
  const regionLabel = useMemo(() => {
    if (search.sido && search.district) return `${toRegionLabel(search.sido)} ${search.district}`
    if (search.sido) return toRegionLabel(search.sido)
    if (filters.regions.length > 0) return filters.regions.join(' · ')
    return ''
  }, [search.sido, search.district, filters.regions])

  const applySearch = (next: JobSearchQuery, nextSort: JobSort = sort) => {
    setSearch(next)
    setPage(1)
    setSearchParams(toParams(next, nextSort), { replace: true })
  }

  const handleSearch = (values: SearchValues) => applySearch(values)

  const handleSortChange = (value: string) => {
    const nextSort = isJobSort(value) ? value : 'latest'
    setSort(nextSort)
    setPage(1)
    setSearchParams(toParams(search, nextSort), { replace: true })
  }

  const handleFiltersChange = (next: JobFilterState) => {
    setFilters(next)
    setPage(1)
  }

  const removeSearchField = (field: keyof JobSearchQuery) => {
    const next = { ...search, [field]: '' }
    // 지역을 지우면 그 아래 구·군도 함께 지운다
    if (field === 'sido') next.district = ''
    setSearchFormKey((prev) => prev + 1)
    applySearch(next)
  }

  const removeFilterValue = (group: JobFilterGroup, value: string) => {
    handleFiltersChange({ ...filters, [group]: filters[group].filter((item) => item !== value) })
  }

  const resetFilters = () => handleFiltersChange(EMPTY_JOB_FILTERS)

  const resetAll = () => {
    setFilters(EMPTY_JOB_FILTERS)
    setSearchFormKey((prev) => prev + 1)
    applySearch(EMPTY_JOB_SEARCH)
  }

  /** 지역 변경 — 검색 패널로 이동해 지역 셀렉트에 포커스를 준다 */
  const focusRegionField = () => {
    const container = searchRef.current
    if (!container) return
    container.scrollIntoView({ block: 'center' })
    container.querySelector('select')?.focus()
  }

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb items={[{ label: '홈', to: '/' }, { label: '내 주변 일자리' }]} />

      {/* ---------------- 페이지 타이틀 ---------------- */}
      <header className="mt-3">
        <h1 className="text-3xl font-bold text-fg">내 주변 일자리</h1>
        <p className="mt-2 text-base text-fg-muted">
          내가 선택한 지역을 기준으로 가까운 일자리를 찾아보세요.
        </p>
      </header>

      {/* ---------------- 검색 ---------------- */}
      <div ref={searchRef}>
        <JobSearchBar
          key={searchFormKey}
          variant="compact"
          className="mt-5"
          defaultValues={search}
          onSearch={handleSearch}
        />
      </div>

      {/* ---------------- 지역 기준 안내 ---------------- */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card border border-primary/35 bg-primary-light/60 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary-deep" aria-hidden />
          <div>
            {regionLabel ? (
              <>
                <p className="text-base font-bold text-fg">
                  {regionLabel} 기준으로 찾고 있어요
                </p>
                <p className="mt-0.5 text-base text-fg-muted">
                  선택한 지역을 기준으로 주변 구인공고를 보여드립니다.
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-fg">지역을 선택해 주세요</p>
                <p className="mt-0.5 text-base text-fg-muted">
                  지역을 선택하면 해당 지역의 일자리를 모아서 보여드려요.
                </p>
              </>
            )}
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={focusRegionField}>
          {regionLabel ? '지역 변경' : '지역 선택'}
        </Button>
      </div>

      {/* ---------------- 검색 결과 요약 + 정렬 ---------------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-lg text-fg-muted">
          {regionLabel ? `${regionLabel} 주변 일자리` : '전체 구인공고'}{' '}
          <strong className="font-bold text-primary-deep tabular">
            {formatNumber(totalElements)}
          </strong>
          건
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="nearby-sort" className="text-base text-fg-muted">
            정렬
          </label>
          <Select
            id="nearby-sort"
            options={JOB_SORT_OPTIONS}
            value={sort}
            onChange={(event) => handleSortChange(event.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      {/* 적용된 검색 조건 — 각 조건은 개별 해제할 수 있다 */}
      {hasCondition && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(Object.keys(SEARCH_FIELD_LABEL) as (keyof JobSearchQuery)[])
            .filter((field) => search[field])
            .map((field) => (
              <Tag key={field} onRemove={() => removeSearchField(field)}>
                {SEARCH_FIELD_LABEL[field]} {FILTER_VALUE_LABEL[search[field]] ?? search[field]}
              </Tag>
            ))}

          {(Object.keys(filters) as JobFilterGroup[]).flatMap((group) =>
            filters[group].map((value) => (
              <Tag key={`${group}-${value}`} onRemove={() => removeFilterValue(group, value)}>
                {FILTER_VALUE_LABEL[value] ?? value}
              </Tag>
            )),
          )}

          <button
            type="button"
            onClick={resetAll}
            className="inline-flex h-7 items-center px-1 text-sm text-fg-muted underline underline-offset-4 hover:text-primary-deep"
          >
            전체 해제
          </button>
        </div>
      )}

      {/* ---------------- 좌: 필터 / 우: 목록 ---------------- */}
      <div className="mt-5 gap-6 lg:flex">
        <JobFilterPanel
          className="mb-6 self-start lg:mb-0 lg:w-[248px] lg:shrink-0"
          value={filters}
          onChange={handleFiltersChange}
          onReset={resetFilters}
          counts={counts}
        />

        <section className="min-w-0 flex-1" aria-label="내 주변 구인공고 목록">
          {loading ? (
            <div className="overflow-hidden rounded-card border border-border">
              <LoadingState rows={PAGE_SIZE} />
            </div>
          ) : error ? (
            <LoadFailed message={error} onRetry={reload} />
          ) : jobs.length > 0 ? (
            <ul className="overflow-hidden rounded-card border border-border">
              {jobs.map((job) => (
                <li key={job.id} className="border-b border-border last:border-b-0">
                  <JobListItem job={job} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-card border border-border bg-surface">
              <EmptyState
                title="선택한 조건에 맞는 일자리가 없습니다."
                description="지역이나 검색 조건을 변경해보세요."
                action={
                  <Button variant="secondary" size="sm" onClick={resetAll}>
                    검색 조건 초기화
                  </Button>
                }
              />
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-8" />
        </section>
      </div>
    </div>
  )
}
