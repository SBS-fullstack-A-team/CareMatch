import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { Pagination } from '@/components/common/pagination'
import { JobSearchBar, type SearchValues } from '@/components/common/search-bar'
import { JobFilterPanel } from '@/components/job/job-filter-panel'
import { JobListItem } from '@/components/job/job-list-item'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Tag } from '@/components/ui/tag'
import { CATEGORY_OPTIONS, JOB_SORT_OPTIONS, PAY_TYPE_OPTIONS } from '@/data/filters'
import { JOBS } from '@/data/mock/jobs'
import {
  applyFilters,
  EMPTY_JOB_FILTERS,
  EMPTY_JOB_SEARCH,
  isJobSort,
  matchesSearch,
  sortJobs,
  type JobFilterGroup,
  type JobFilterState,
  type JobSearchQuery,
  type JobSort,
} from '@/lib/job-filters'
import { formatNumber } from '@/lib/utils'

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
  [...PAY_TYPE_OPTIONS, ...CATEGORY_OPTIONS].map((option) => [option.value, option.label]),
) as Record<string, string>

/** 검색 조건은 URL 로 공유할 수 있게 쿼리스트링과 주고받는다 */
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

/**
 * 구인공고 목록 (COMPONENT_RULES.md §17 / DESIGN_SYSTEM.md §6)
 *
 * 페이지 타이틀 → 검색 → 결과 요약·정렬 → (좌) 필터 / (우) 목록 → 페이지네이션
 * 목적성이 높은 업무형 화면이라 메인과 달리 Hero 배너를 두지 않는다.
 *
 * 검색·필터·정렬·페이지네이션은 아직 API 가 없어 mock 데이터 위에서 동작한다.
 */
export function JobListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState<JobSearchQuery>(() => readSearch(searchParams))
  /** 칩 삭제·초기화로 검색값이 바뀌면 검색 패널을 다시 그려 값을 맞춘다 */
  const [searchFormKey, setSearchFormKey] = useState(0)
  const [filters, setFilters] = useState<JobFilterState>(EMPTY_JOB_FILTERS)
  const [sort, setSort] = useState<JobSort>(() => {
    const value = searchParams.get('sort')
    return isJobSort(value) ? value : 'latest'
  })
  const [page, setPage] = useState(1)

  const searched = useMemo(() => JOBS.filter((job) => matchesSearch(job, search)), [search])
  const filtered = useMemo(() => applyFilters(searched, filters), [searched, filters])
  const sorted = useMemo(() => sortJobs(filtered, sort), [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageJobs = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasSearch = Object.values(search).some(Boolean)
  const hasFilters = Object.values(filters).some((group) => group.length > 0)
  const hasCondition = hasSearch || hasFilters

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

  return (
    <div className="container-page py-8 lg:py-10">
      {/* ---------------- 페이지 타이틀 ---------------- */}
      <header>
        <h1 className="text-3xl font-bold text-fg">구인공고</h1>
        <p className="mt-2 text-base text-fg-muted">나에게 맞는 요양 일자리를 찾아보세요.</p>
      </header>

      {/* ---------------- 검색 ---------------- */}
      <JobSearchBar
        key={searchFormKey}
        variant="compact"
        className="mt-5"
        defaultValues={search}
        onSearch={handleSearch}
      />

      {/* ---------------- 검색 결과 요약 + 정렬 ---------------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-lg text-fg-muted">
          {hasCondition ? '검색 결과' : '전체 구인공고'}{' '}
          <strong className="font-bold text-primary-deep tabular">
            {formatNumber(sorted.length)}
          </strong>
          건
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="job-sort" className="text-base text-fg-muted">
            정렬
          </label>
          <Select
            id="job-sort"
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
          jobs={searched}
        />

        <section className="min-w-0 flex-1" aria-label="구인공고 목록">
          {pageJobs.length > 0 ? (
            <ul className="overflow-hidden rounded-card border border-border">
              {pageJobs.map((job) => (
                <li key={job.id} className="border-b border-border last:border-b-0">
                  <JobListItem job={job} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-card border border-border bg-surface">
              <EmptyState
                title="검색 조건에 맞는 구인공고가 없습니다."
                description="검색 조건을 변경하거나 필터를 초기화해보세요."
                action={
                  <Button variant="secondary" size="sm" onClick={resetAll}>
                    검색 조건 초기화
                  </Button>
                }
              />
            </div>
          )}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
            className="mt-8"
          />
        </section>
      </div>
    </div>
  )
}
