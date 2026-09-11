/** 구인공고 API. docs/API.md, JobPostingController */
import { apiFetch } from '@/lib/api-client'
import type {
  JobFacetsResponse,
  JobPostingDetailResponse,
  JobPostingSearchParams,
  JobPostingSummaryResponse,
  PageResponse,
} from '@/types/api'

/**
 * 검색/필터 파라미터를 쿼리스트링으로 만든다. 다중값은 같은 키를 반복한다(jobTypes=A&jobTypes=B).
 * `page`/`size` 를 뺀 버전은 {@link buildFacetQuery} 를 쓴다.
 */
function buildSearchQuery(params: JobPostingSearchParams): URLSearchParams {
  const query = new URLSearchParams()
  if (params.sigungu) query.set('sigungu', params.sigungu)
  if (params.payMin != null) query.set('payMin', String(params.payMin))
  if (params.payMax != null) query.set('payMax', String(params.payMax))
  if (params.sort) query.set('sort', params.sort)
  if (params.keyword) query.set('keyword', params.keyword)

  const multiValued: [string, string[] | undefined][] = [
    ['sidos', params.sidos],
    ['jobTypes', params.jobTypes],
    ['facilityTypes', params.facilityTypes],
    ['workTypes', params.workTypes],
    ['workSchedules', params.workSchedules],
    ['employmentTypes', params.employmentTypes],
    ['payTypes', params.payTypes],
  ]
  multiValued.forEach(([key, values]) => values?.forEach((value) => query.append(key, value)))

  return query
}

/**
 * 목록/검색. 로그인 상태면(토큰이 있으면) `apiFetch` 가 자동으로 Authorization 을 붙여
 * 응답에 찜 여부(scrapped)·매칭점수가 함께 채워진다 — 이 API 는 비로그인도 공개라 auth 옵션은 그대로 둔다.
 */
export function getJobPostings(
  params: JobPostingSearchParams = {},
): Promise<PageResponse<JobPostingSummaryResponse>> {
  const query = buildSearchQuery(params)
  if (params.page != null) query.set('page', String(params.page))
  if (params.size != null) query.set('size', String(params.size))
  return apiFetch<PageResponse<JobPostingSummaryResponse>>(`/api/job-postings?${query.toString()}`)
}

/** 좌측 필터 패널의 옵션별 결과 건수. page/size/sort 는 의미 없어 받지 않는다. */
export function getJobPostingFacets(
  params: Omit<JobPostingSearchParams, 'sort' | 'page' | 'size'> = {},
): Promise<JobFacetsResponse> {
  const query = buildSearchQuery(params)
  return apiFetch<JobFacetsResponse>(`/api/job-postings/facets?${query.toString()}`)
}

/** "스페셜 채용정보" 상단 노출용 SPECIAL 공고 상위 3. */
export function getFeaturedJobPostings(): Promise<JobPostingSummaryResponse[]> {
  return apiFetch<JobPostingSummaryResponse[]>('/api/job-postings/featured')
}

/** 공고 상세. 호출하면 서버에서 조회수가 +1 된다. */
export function getJobPosting(jobPostingId: number | string): Promise<JobPostingDetailResponse> {
  return apiFetch<JobPostingDetailResponse>(`/api/job-postings/${jobPostingId}`)
}

/** 비슷한 공고 (같은 시군구 + 직종, 최대 6). */
export function getSimilarJobPostings(jobPostingId: number | string): Promise<JobPostingSummaryResponse[]> {
  return apiFetch<JobPostingSummaryResponse[]>(`/api/job-postings/${jobPostingId}/similar`)
}
