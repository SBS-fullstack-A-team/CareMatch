/** 인재(구직자) API. docs/API.md, JobSeekerController */
import { apiFetch } from '@/lib/api-client'
import type {
  ContactUnlockResponseDto,
  JobSeekerProfileResponseDto,
  JobSeekerProfileUpdateRequestDto,
  PageResponse,
  TalentFacetsResponse,
  TalentSearchParams,
  TalentSummaryResponse,
} from '@/types/api'

function buildSearchQuery(params: TalentSearchParams): URLSearchParams {
  const query = new URLSearchParams()
  if (params.desiredWorkType) query.set('desiredWorkType', params.desiredWorkType)
  if (params.sigungu) query.set('sigungu', params.sigungu)
  if (params.payMax != null) query.set('payMax', String(params.payMax))
  if (params.gender) query.set('gender', params.gender)
  if (params.seekingOnly != null) query.set('seekingOnly', String(params.seekingOnly))
  if (params.updatedWithinDays != null) query.set('updatedWithinDays', String(params.updatedWithinDays))
  if (params.sort) query.set('sort', params.sort)

  const multiValued: [string, string[] | undefined][] = [
    ['desiredJobTypes', params.desiredJobTypes],
    ['desiredWorkSchedules', params.desiredWorkSchedules],
    ['sidos', params.sidos],
    ['payTypes', params.payTypes],
    ['careerBuckets', params.careerBuckets],
    ['availableTasks', params.availableTasks],
    ['desiredEmploymentTypes', params.desiredEmploymentTypes],
    ['certificateTypes', params.certificateTypes],
  ]
  multiValued.forEach(([key, values]) => values?.forEach((value) => query.append(key, value)))

  return query
}

/** 인재 검색 목록. 승인 시설회원/관리자만. */
export function getTalents(params: TalentSearchParams = {}): Promise<PageResponse<TalentSummaryResponse>> {
  const query = buildSearchQuery(params)
  if (params.page != null) query.set('page', String(params.page))
  if (params.size != null) query.set('size', String(params.size))
  return apiFetch<PageResponse<TalentSummaryResponse>>(`/api/jobseekers?${query.toString()}`)
}

/** 좌측 필터 패널의 옵션별 결과 인원수. */
export function getTalentFacets(
  params: Omit<TalentSearchParams, 'sort' | 'page' | 'size'> = {},
): Promise<TalentFacetsResponse> {
  const query = buildSearchQuery(params)
  return apiFetch<TalentFacetsResponse>(`/api/jobseekers/facets?${query.toString()}`)
}

/** 인재 상세 (시설회원/관리자). */
export function getTalent(profileId: number | string): Promise<JobSeekerProfileResponseDto> {
  return apiFetch<JobSeekerProfileResponseDto>(`/api/jobseekers/${profileId}`)
}

/** 내 구직자 프로필. */
export function getMyJobSeekerProfile(): Promise<JobSeekerProfileResponseDto> {
  return apiFetch<JobSeekerProfileResponseDto>('/api/jobseekers/me')
}

/** 내 구직자 프로필 수정 (거주지·자기소개·취업상태·희망 근무조건). */
export function updateMyJobSeekerProfile(
  req: JobSeekerProfileUpdateRequestDto,
): Promise<JobSeekerProfileResponseDto> {
  return apiFetch<JobSeekerProfileResponseDto>('/api/jobseekers/me', { method: 'PUT', body: req })
}

/**
 * 연락처 열람. 이미 열람 이력이 있으면 무료(free=true), 없으면 포인트 차감.
 * 대상이 취업완료(EMPLOYED)면 409.
 */
export function unlockContact(profileId: number | string): Promise<ContactUnlockResponseDto> {
  return apiFetch<ContactUnlockResponseDto>(`/api/jobseekers/${profileId}/contact/unlock`, {
    method: 'POST',
  })
}
