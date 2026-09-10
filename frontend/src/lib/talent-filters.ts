import { jobCategoryLabel } from '@/data/labels'
import { toRegionLabel } from '@/lib/job-filters'
import type { Talent } from '@/types'

/* =========================================================================
   인재정보 목록의 검색 / 필터 / 정렬 규칙.
   화면(TalentList) 과 좌측 필터 패널이 같은 규칙을 공유하도록 한 곳에 모아 둔다.
   구인공고의 job-filters.ts 와 같은 구조지만, 인재는 지역·자격증이 배열이라
   값 추출기가 string[] 을 돌려준다.
   ========================================================================= */

/** 검색 패널(TalentSearchBar)의 5개 필드 */
export interface TalentSearchQuery {
  sido: string
  district: string
  category: string
  workType: string
  keyword: string
}

export const EMPTY_TALENT_SEARCH: TalentSearchQuery = {
  sido: '',
  district: '',
  category: '',
  workType: '',
  keyword: '',
}

/** 좌측 필터의 체크박스 그룹 (그룹 안에서는 OR / 그룹 사이는 AND) */
export interface TalentFilterState {
  /** "서울", "경기" 같은 시·도 짧은 라벨 */
  regions: string[]
  categories: string[]
  workTypes: string[]
  /** CAREER_OPTIONS 의 value ('entry' | '1-3' | '3-5' | '5+') */
  careers: string[]
  certificates: string[]
}

export type TalentFilterGroup = keyof TalentFilterState

export const EMPTY_TALENT_FILTERS: TalentFilterState = {
  regions: [],
  categories: [],
  workTypes: [],
  careers: [],
  certificates: [],
}

export const TALENT_SORTS = ['updated', 'careerDesc', 'careerAsc'] as const
export type TalentSort = (typeof TALENT_SORTS)[number]

export function isTalentSort(value: string | null): value is TalentSort {
  return TALENT_SORTS.includes(value as TalentSort)
}

/** "서울 강남구" -> "서울". 희망 지역이 여러 개면 시·도도 여러 개다. */
function regionLabelsOf(talent: Talent) {
  return [...new Set(talent.regions.map((region) => region.split(' ')[0]))]
}

/** careerYears 를 CAREER_OPTIONS 의 구간 키로 바꾼다 */
export function careerBucket(years: number | undefined) {
  if (years === undefined) return undefined
  if (years < 1) return 'entry'
  if (years < 3) return '1-3'
  if (years < 5) return '3-5'
  return '5+'
}

/** 그룹별 비교 값 추출기 — 필터링과 건수 집계가 같은 기준을 쓰도록 한다 */
const GROUP_VALUES: Record<TalentFilterGroup, (talent: Talent) => string[]> = {
  regions: regionLabelsOf,
  categories: (talent) => [talent.category],
  workTypes: (talent) => (talent.workType ? [talent.workType] : []),
  careers: (talent) => {
    const bucket = careerBucket(talent.careerYears)
    return bucket ? [bucket] : []
  },
  certificates: (talent) => talent.certificates,
}

/** 상단 검색 패널 조건 */
export function matchesSearch(talent: Talent, query: TalentSearchQuery) {
  if (query.sido && !regionLabelsOf(talent).includes(toRegionLabel(query.sido))) return false
  if (query.district && !talent.regions.some((region) => region.includes(query.district))) {
    return false
  }
  if (query.category && talent.category !== query.category) return false
  if (query.workType && talent.workType !== query.workType) return false

  if (query.keyword.trim()) {
    const keyword = query.keyword.trim().toLowerCase()
    // 실명은 마스킹해서 노출하므로 검색 대상에 넣지 않는다 (DESIGN_SYSTEM.md §21)
    const haystack = [
      jobCategoryLabel(talent.category),
      talent.workType,
      talent.careerLabel,
      talent.preferredHours,
      talent.summary,
      ...talent.regions,
      ...talent.certificates,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(keyword)) return false
  }

  return true
}

/** 좌측 필터 적용. except 를 주면 해당 그룹만 빼고 적용한다 (건수 집계용) */
export function applyFilters(
  talents: Talent[],
  filters: TalentFilterState,
  except?: TalentFilterGroup,
) {
  const groups = (Object.keys(GROUP_VALUES) as TalentFilterGroup[]).filter(
    (group) => group !== except && filters[group].length > 0,
  )
  if (groups.length === 0) return talents

  return talents.filter((talent) =>
    groups.every((group) =>
      GROUP_VALUES[group](talent).some((value) => filters[group].includes(value)),
    ),
  )
}

/**
 * 옵션별 결과 인원수.
 * 자기 그룹의 선택은 제외하고 세므로, 한 그룹 안에서 다른 항목을 켰을 때의
 * 인원수가 0 으로 사라지지 않는다.
 */
export function countByOption(
  talents: Talent[],
  filters: TalentFilterState,
  group: TalentFilterGroup,
) {
  const base = applyFilters(talents, filters, group)
  const counts: Record<string, number> = {}
  base.forEach((talent) => {
    // 지역·자격증은 한 사람이 여러 값을 가지므로 값마다 한 번씩 센다
    new Set(GROUP_VALUES[group](talent)).forEach((value) => {
      counts[value] = (counts[value] ?? 0) + 1
    })
  })
  return counts
}

/** 경력 미기재는 정렬 방향과 무관하게 항상 뒤로 보낸다 */
export function sortTalents(talents: Talent[], sort: TalentSort) {
  const sorted = [...talents]

  if (sort === 'updated') {
    return sorted.sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
    )
  }

  return sorted.sort((a, b) => {
    const careerA = a.careerYears
    const careerB = b.careerYears
    if (careerA === undefined && careerB === undefined) return a.id.localeCompare(b.id)
    if (careerA === undefined) return 1
    if (careerB === undefined) return -1
    const diff = sort === 'careerDesc' ? careerB - careerA : careerA - careerB
    return diff || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id)
  })
}
