import { REGION_SHORTCUTS } from '@/data/filters'
import { employmentTypeLabel, facilityTypeLabel, jobCategoryLabel, workScheduleLabel } from '@/data/labels'
import type { Job } from '@/types'

/* =========================================================================
   구인공고 목록의 검색 / 필터 / 정렬 규칙.
   화면(JobList) 과 좌측 필터 패널이 같은 규칙을 공유하도록 한 곳에 모아 둔다.
   ========================================================================= */

/** 검색 패널(JobSearchBar)의 5개 필드. SearchValues 와 구조가 같다. */
export interface JobSearchQuery {
  sido: string
  district: string
  category: string
  facilityType: string
  keyword: string
}

export const EMPTY_JOB_SEARCH: JobSearchQuery = {
  sido: '',
  district: '',
  category: '',
  facilityType: '',
  keyword: '',
}

/** 좌측 필터의 체크박스 그룹 (다중 선택, 그룹 안에서는 OR / 그룹 사이는 AND) */
export interface JobFilterState {
  /** "서울", "경기" 같은 시·도 짧은 라벨 */
  regions: string[]
  categories: string[]
  facilityTypes: string[]
  /** Job.workSchedule (WorkSchedule enum name) */
  workSchedules: string[]
  /** Job.payType */
  payTypes: string[]
}

export type JobFilterGroup = keyof JobFilterState

export const EMPTY_JOB_FILTERS: JobFilterState = {
  regions: [],
  categories: [],
  facilityTypes: [],
  workSchedules: [],
  payTypes: [],
}

export const JOB_SORTS = ['latest', 'payDesc', 'payAsc'] as const
export type JobSort = (typeof JOB_SORTS)[number]

export function isJobSort(value: string | null): value is JobSort {
  return JOB_SORTS.includes(value as JobSort)
}

/** "서울특별시" -> "서울". Job.region 이 짧은 라벨로 시작하므로 비교 기준을 맞춘다. */
export function toRegionLabel(sido: string) {
  return REGION_SHORTCUTS.find((region) => region.sido === sido)?.label ?? sido
}

/** "서울 강남구" -> "서울" */
function regionLabelOf(job: Job) {
  return job.region.split(' ')[0]
}

/** 그룹별 비교 값 추출기 — 필터링과 건수 집계가 같은 기준을 쓰도록 한다 */
const GROUP_VALUE: Record<JobFilterGroup, (job: Job) => string> = {
  regions: regionLabelOf,
  categories: (job) => job.category,
  facilityTypes: (job) => job.facilityType,
  workSchedules: (job) => job.workSchedule ?? '',
  payTypes: (job) => job.payType,
}

/** 상단 검색 패널 조건 */
export function matchesSearch(job: Job, query: JobSearchQuery) {
  if (query.sido && regionLabelOf(job) !== toRegionLabel(query.sido)) return false
  if (query.district && !job.region.includes(query.district) && job.district !== query.district) {
    return false
  }
  if (query.category && job.category !== query.category) return false
  if (query.facilityType && job.facilityType !== query.facilityType) return false

  if (query.keyword.trim()) {
    const keyword = query.keyword.trim().toLowerCase()
    const haystack = [
      job.title,
      job.facilityName,
      facilityTypeLabel(job.facilityType),
      jobCategoryLabel(job.category),
      job.region,
      job.district,
      workScheduleLabel(job.workSchedule),
      employmentTypeLabel(job.employmentType),
      ...(job.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(keyword)) return false
  }

  return true
}

/** 좌측 필터 적용. except 를 주면 해당 그룹만 빼고 적용한다 (건수 집계용) */
export function applyFilters(jobs: Job[], filters: JobFilterState, except?: JobFilterGroup) {
  const groups = (Object.keys(GROUP_VALUE) as JobFilterGroup[]).filter(
    (group) => group !== except && filters[group].length > 0,
  )
  if (groups.length === 0) return jobs
  return jobs.filter((job) => groups.every((group) => filters[group].includes(GROUP_VALUE[group](job))))
}

/**
 * 옵션별 결과 건수.
 * 자기 그룹의 선택은 제외하고 세므로, 한 그룹 안에서 다른 항목을 켰을 때의
 * 건수가 0 으로 사라지지 않는다.
 */
export function countByOption(jobs: Job[], filters: JobFilterState, group: JobFilterGroup) {
  const base = applyFilters(jobs, filters, group)
  const counts: Record<string, number> = {}
  base.forEach((job) => {
    const value = GROUP_VALUE[group](job)
    counts[value] = (counts[value] ?? 0) + 1
  })
  return counts
}

/**
 * 급여 형태가 달라도 비교할 수 있도록 월 환산 금액을 만든다.
 * 주 40시간 기준 월 소정근로시간 209시간, 월 21일 근무를 기준으로 한다.
 * 협의(급여 미표기) 공고는 정렬 방향과 무관하게 항상 뒤로 보낸다.
 */
const MONTHLY_HOURS = 209
const MONTHLY_DAYS = 21

function monthlyPay(job: Job) {
  if (job.payType === 'negotiable' || job.payAmount === undefined) return undefined
  switch (job.payType) {
    case 'hourly':
      return job.payAmount * MONTHLY_HOURS
    case 'daily':
      return job.payAmount * MONTHLY_DAYS
    case 'annual':
      return job.payAmount / 12
    default:
      return job.payAmount
  }
}

export function sortJobs(jobs: Job[], sort: JobSort) {
  const sorted = [...jobs]

  if (sort === 'latest') {
    return sorted.sort((a, b) => b.postedAt.localeCompare(a.postedAt) || a.id.localeCompare(b.id))
  }

  return sorted.sort((a, b) => {
    const payA = monthlyPay(a)
    const payB = monthlyPay(b)
    if (payA === undefined && payB === undefined) return a.id.localeCompare(b.id)
    if (payA === undefined) return 1
    if (payB === undefined) return -1
    const diff = sort === 'payDesc' ? payB - payA : payA - payB
    return diff || a.id.localeCompare(b.id)
  })
}
