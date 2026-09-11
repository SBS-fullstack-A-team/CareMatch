/** 공고 스크랩(찜) API. docs/API.md, ScrapController */
import { apiFetch } from '@/lib/api-client'
import type { JobPostingSummary, PageResponse } from '@/types/api'

/** 내 관심 공고 목록. page 는 0-base. */
export function getMyScraps(page = 0, size = 10): Promise<PageResponse<JobPostingSummary>> {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch<PageResponse<JobPostingSummary>>(`/api/members/me/scraps?${query.toString()}`)
}

/** 관심 공고 등록. */
export function addScrap(jobPostingId: number): Promise<void> {
  return apiFetch<void>(`/api/job-postings/${jobPostingId}/scrap`, { method: 'POST' })
}

/** 관심 공고 해제. */
export function removeScrap(jobPostingId: number): Promise<void> {
  return apiFetch<void>(`/api/job-postings/${jobPostingId}/scrap`, { method: 'DELETE' })
}
