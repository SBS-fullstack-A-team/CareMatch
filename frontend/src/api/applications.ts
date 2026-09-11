/** 지원 API (마이페이지에서 쓰는 부분만). docs/API.md, ApplicationController */
import { apiFetch } from '@/lib/api-client'
import type { ApplicationStatus, MyApplicationResponse, PageResponse } from '@/types/api'

/** 내 지원 목록. status 를 주면 그 상태만. page 는 0-base. */
export function getMyApplications(
  status?: ApplicationStatus,
  page = 0,
  size = 10,
): Promise<PageResponse<MyApplicationResponse>> {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) query.set('status', status)
  return apiFetch<PageResponse<MyApplicationResponse>>(
    `/api/members/me/applications?${query.toString()}`,
  )
}

/** 지원 취소. 취소 가능한 상태(APPLIED)가 아니면 서버가 ApiError 로 거절한다. */
export function cancelApplication(applicationId: number): Promise<void> {
  return apiFetch<void>(`/api/applications/${applicationId}/cancel`, { method: 'PATCH' })
}
