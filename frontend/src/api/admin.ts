/** 관리자 전용 API. 전부 ROLE_ADMIN 필요(백엔드 /api/admin/** 가 강제). */
import { apiFetch } from '@/lib/api-client'
import type {
  AdminMemberSummary,
  AdminPointChargeSummary,
  FacilityApprovalItem,
  FacilityApprovalStatus,
  InquiryReplyRequest,
  InquiryResponse,
  MemberRole,
  MemberStatus,
  NoticeDetail,
  NoticeUpsertRequest,
  SpringPage,
} from '@/types/api'

/** 회원관리 — 역할/상태/키워드(이름·아이디·이메일·연락처) 검색. page 는 0-base. */
export function searchMembers(params: {
  role?: MemberRole
  status?: MemberStatus
  keyword?: string
  page?: number
  size?: number
}): Promise<SpringPage<AdminMemberSummary>> {
  const query = new URLSearchParams()
  if (params.role) query.set('role', params.role)
  if (params.status) query.set('status', params.status)
  if (params.keyword) query.set('keyword', params.keyword)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  return apiFetch<SpringPage<AdminMemberSummary>>(`/api/admin/members?${query.toString()}`)
}

/** 포인트충전관리 — 전체 회원 충전 내역. page 는 0-base. */
export function getAdminPointCharges(params: {
  status?: 'PENDING' | 'PAID'
  page?: number
  size?: number
}): Promise<SpringPage<AdminPointChargeSummary>> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  return apiFetch<SpringPage<AdminPointChargeSummary>>(`/api/admin/points/charges?${query.toString()}`)
}

/** 시설관리 — 승인상태별 시설회원 목록(사업자등록증 열람 URL 포함). page 는 0-base. */
export function getAdminFacilities(params: {
  status?: FacilityApprovalStatus
  page?: number
  size?: number
}): Promise<SpringPage<FacilityApprovalItem>> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  return apiFetch<SpringPage<FacilityApprovalItem>>(`/api/admin/facilities?${query.toString()}`)
}

export function approveFacility(facilityProfileId: number): Promise<FacilityApprovalItem> {
  return apiFetch<FacilityApprovalItem>(`/api/admin/facilities/${facilityProfileId}/approve`, {
    method: 'POST',
  })
}

export function rejectFacility(facilityProfileId: number, reason: string): Promise<FacilityApprovalItem> {
  return apiFetch<FacilityApprovalItem>(`/api/admin/facilities/${facilityProfileId}/reject`, {
    method: 'POST',
    body: { reason },
  })
}

/** 문의관리 — 전체 문의 목록(작성자 이름/이메일 포함). page 는 0-base. */
export function getAdminInquiries(params: {
  status?: 'PENDING' | 'ANSWERED'
  page?: number
  size?: number
}): Promise<SpringPage<InquiryResponse>> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  return apiFetch<SpringPage<InquiryResponse>>(`/api/admin/support/inquiries?${query.toString()}`)
}

/** 문의 답변 등록. 성공하면 문의 상태가 ANSWERED 로 바뀐다. */
export function replyToInquiry(inquiryId: number, req: InquiryReplyRequest): Promise<InquiryResponse> {
  return apiFetch<InquiryResponse>(`/api/admin/support/inquiries/${inquiryId}/replies`, {
    method: 'POST',
    body: req,
  })
}

/** 공지사항 작성. */
export function createNotice(req: NoticeUpsertRequest): Promise<NoticeDetail> {
  return apiFetch<NoticeDetail>('/api/admin/support/notices', { method: 'POST', body: req })
}

/** 공지사항 수정. */
export function updateNotice(id: number | string, req: NoticeUpsertRequest): Promise<NoticeDetail> {
  return apiFetch<NoticeDetail>(`/api/admin/support/notices/${id}`, { method: 'PUT', body: req })
}

/** 공지사항 삭제. */
export function deleteNotice(id: number | string): Promise<void> {
  return apiFetch<void>(`/api/admin/support/notices/${id}`, { method: 'DELETE' })
}
