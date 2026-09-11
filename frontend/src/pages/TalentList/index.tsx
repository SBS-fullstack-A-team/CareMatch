import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { TalentSearchBar } from '@/components/talent/talent-search-bar'
import {
  EMPTY_TALENT_FILTER_COUNTS,
  TalentFilterPanel,
  type TalentFilterCounts,
} from '@/components/talent/talent-filter-panel'
import { TalentListCard } from '@/components/talent/talent-list-card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Tag } from '@/components/ui/tag'
import { getTalentFacets, getTalents } from '@/api/jobseekers'
import {
  CAREER_OPTIONS,
  CATEGORY_OPTIONS,
  CERTIFICATE_OPTIONS,
  TALENT_SORT_OPTIONS,
  WORK_SCHEDULE_OPTIONS,
} from '@/data/filters'
import { useAsync } from '@/hooks/use-async'
import { summaryToTalent } from '@/lib/talent-adapter'
import {
  EMPTY_TALENT_FILTERS,
  EMPTY_TALENT_SEARCH,
  isTalentSort,
  toTalentSearchParams,
  type TalentFilterGroup,
  type TalentFilterState,
  type TalentSearchQuery,
  type TalentSort,
} from '@/lib/talent-filters'
import { toRegionLabel } from '@/lib/job-filters'
import { formatNumber } from '@/lib/utils'
import { LoadFailed } from '@/pages/Support/shared'
import type { TalentFacetsResponse } from '@/types/api'

/** 3열 × 4행 */
const PAGE_SIZE = 12

const SEARCH_FIELD_LABEL: Record<keyof TalentSearchQuery, string> = {
  sido: '지역',
  district: '구·군',
  category: '희망직종',
  workSchedule: '근무 시간대',
  keyword: '키워드',
}

/** 값('1-3', 'CAREGIVER', 'DAY')과 표기 라벨('1~3년', '요양보호사', '주간')이 다른 필터의 칩 표기용 라벨 */
const FILTER_VALUE_LABEL = Object.fromEntries(
  [
    ...CAREER_OPTIONS,
    ...CATEGORY_OPTIONS,
    ...WORK_SCHEDULE_OPTIONS,
    ...CERTIFICATE_OPTIONS,
  ].map((option) => [option.value, option.label]),
) as Record<string, string>

/** 검색 조건은 URL 로 공유할 수 있게 쿼리스트링과 주고받는다 */
function readSearch(params: URLSearchParams): TalentSearchQuery {
  return {
    sido: params.get('sido') ?? '',
    district: params.get('district') ?? '',
    category: params.get('category') ?? '',
    workSchedule: params.get('workSchedule') ?? '',
    keyword: params.get('keyword') ?? '',
  }
}

function toParams(search: TalentSearchQuery, sort: TalentSort) {
  const params = new URLSearchParams()
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  if (sort !== 'updated') params.set('sort', sort)
  return params
}

const CAREER_BUCKET_FROM_API: Record<string, string> = {
  ENTRY: 'entry',
  Y1_3: '1-3',
  Y3_5: '3-5',
  Y5_PLUS: '5+',
}

/** `GET /api/jobseekers/facets` 응답을 좌측 필터 패널이 쓰는 형태로 옮긴다. 자격증 축은 항상 빈 값. */
function toFilterCounts(facets: TalentFacetsResponse | null): TalentFilterCounts {
  if (!facets) return EMPTY_TALENT_FILTER_COUNTS
  return {
    regions: Object.fromEntries(
      Object.entries(facets.sido).map(([sido, count]) => [toRegionLabel(sido), count]),
    ),
    categories: facets.desiredJobType,
    workSchedules: facets.desiredWorkSchedule,
    careers: Object.fromEntries(
      Object.entries(facets.careerBucket).map(([bucket, count]) => [
        CAREER_BUCKET_FROM_API[bucket] ?? bucket,
        count,
      ]),
    ),
    certificates: {},
  }
}

/**
 * 인재정보 목록 (COMPONENT_RULES.md §17 / DESIGN_SYSTEM.md §6)
 *
 * Breadcrumb → 페이지 타이틀 → 검색 → 결과 요약·정렬 → (좌) 필터 / (우) 카드 3열 → 페이지네이션
 * 구인공고 목록과 같은 탐색 구조를 쓰되, 시설 담당자가 구직자를 찾는 방향으로 정보를 재구성했다.
 *
 * `GET /api/jobseekers`(목록)·`/facets`(필터 옵션별 인원수) 를 그대로 쓴다. 자격증 필터는
 * 체크박스만 동작하고 옆 숫자는 없다(백엔드 facets 가 자격증 축을 제공하지 않음).
 * 키워드 검색은 백엔드에 대응 파라미터가 없어 반영되지 않는다.
 */
export function TalentListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState<TalentSearchQuery>(() => readSearch(searchParams))
  /** 칩 삭제·초기화로 검색값이 바뀌면 검색 패널을 다시 그려 값을 맞춘다 */
  const [searchFormKey, setSearchFormKey] = useState(0)
  const [filters, setFilters] = useState<TalentFilterState>(EMPTY_TALENT_FILTERS)
  const [sort, setSort] = useState<TalentSort>(() => {
    const value = searchParams.get('sort')
    return isTalentSort(value) ? value : 'updated'
  })
  const [page, setPage] = useState(1)

  const params = useMemo(() => toTalentSearchParams(search, filters, sort), [search, filters, sort])

  const { data, loading, error, reload } = useAsync(
    () => getTalents({ ...params, page: page - 1, size: PAGE_SIZE }),
    [params, page],
  )
  const { data: facets } = useAsync(() => getTalentFacets(params), [params])

  const talents = useMemo(() => (data?.content ?? []).map(summaryToTalent), [data])
  const totalElements = data?.totalElements ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const counts = useMemo(() => toFilterCounts(facets ?? null), [facets])

  const hasSearch = Object.values(search).some(Boolean)
  const hasFilters = Object.values(filters).some((group) => group.length > 0)
  const hasCondition = hasSearch || hasFilters

  const applySearch = (next: TalentSearchQuery, nextSort: TalentSort = sort) => {
    setSearch(next)
    setPage(1)
    setSearchParams(toParams(next, nextSort), { replace: true })
  }

  const handleSortChange = (value: string) => {
    const nextSort = isTalentSort(value) ? value : 'updated'
    setSort(nextSort)
    setPage(1)
    setSearchParams(toParams(search, nextSort), { replace: true })
  }

  const handleFiltersChange = (next: TalentFilterState) => {
    setFilters(next)
    setPage(1)
  }

  const removeSearchField = (field: keyof TalentSearchQuery) => {
    const next = { ...search, [field]: '' }
    // 지역을 지우면 그 아래 구·군도 함께 지운다
    if (field === 'sido') next.district = ''
    setSearchFormKey((prev) => prev + 1)
    applySearch(next)
  }

  const removeFilterValue = (group: TalentFilterGroup, value: string) => {
    handleFiltersChange({ ...filters, [group]: filters[group].filter((item) => item !== value) })
  }

  const resetFilters = () => handleFiltersChange(EMPTY_TALENT_FILTERS)

  const resetAll = () => {
    setFilters(EMPTY_TALENT_FILTERS)
    setSearchFormKey((prev) => prev + 1)
    applySearch(EMPTY_TALENT_SEARCH)
  }

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb items={[{ label: '홈', to: '/' }, { label: '인재정보' }]} />

      {/* ---------------- 페이지 타이틀 ---------------- */}
      <header className="mt-3">
        <h1 className="text-3xl font-bold text-fg">인재정보</h1>
        <p className="mt-2 text-base text-fg-muted">조건에 맞는 요양·돌봄 인재를 찾아보세요.</p>
      </header>

      {/* ---------------- 검색 ---------------- */}
      <TalentSearchBar
        key={searchFormKey}
        className="mt-5"
        defaultValues={search}
        onSearch={(values) => applySearch(values)}
      />

      {/* ---------------- 검색 결과 요약 + 정렬 ---------------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-lg text-fg-muted">
          {hasCondition ? '검색 결과' : '전체 인재정보'}{' '}
          <strong className="font-bold text-primary-deep tabular">
            {formatNumber(totalElements)}
          </strong>
          건
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="talent-sort" className="text-base text-fg-muted">
            정렬
          </label>
          <Select
            id="talent-sort"
            options={TALENT_SORT_OPTIONS}
            value={sort}
            onChange={(event) => handleSortChange(event.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      {/* 적용된 검색 조건 — 각 조건은 개별 해제할 수 있다 */}
      {hasCondition && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(Object.keys(SEARCH_FIELD_LABEL) as (keyof TalentSearchQuery)[])
            .filter((field) => search[field])
            .map((field) => (
              <Tag key={field} onRemove={() => removeSearchField(field)}>
                {SEARCH_FIELD_LABEL[field]} {FILTER_VALUE_LABEL[search[field]] ?? search[field]}
              </Tag>
            ))}

          {(Object.keys(filters) as TalentFilterGroup[]).flatMap((group) =>
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

      {/* ---------------- 좌: 필터 / 우: 인재 카드 ---------------- */}
      <div className="mt-5 gap-6 lg:flex">
        <TalentFilterPanel
          className="mb-6 self-start lg:mb-0 lg:w-[248px] lg:shrink-0"
          value={filters}
          onChange={handleFiltersChange}
          onReset={resetFilters}
          counts={counts}
        />

        <section className="min-w-0 flex-1" aria-label="인재정보 목록">
          {loading ? (
            <LoadingState rows={PAGE_SIZE} variant="card" />
          ) : error ? (
            <LoadFailed message={error} onRetry={reload} />
          ) : talents.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talents.map((talent) => (
                <li key={talent.id} className="flex">
                  <TalentListCard talent={talent} className="w-full" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-card border border-border bg-surface">
              <EmptyState
                title="조건에 맞는 인재정보가 없습니다."
                description="검색 조건을 변경해 다시 찾아보세요."
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
