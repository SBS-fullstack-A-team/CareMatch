/** 고객센터 API. docs/API.md §8 */
import { apiFetch } from '@/lib/api-client'
import type {
  FaqResponse,
  InquiryCreateRequest,
  InquiryResponse,
  NoticeDetail,
  NoticeSummary,
  SiteConfigResponse,
  SpringPage,
} from '@/types/api'

/** 공지 목록. 상단고정(pinned) 우선. page 는 0-base. */
export function getNotices(page = 0, size = 10): Promise<SpringPage<NoticeSummary>> {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch<SpringPage<NoticeSummary>>(`/api/support/notices?${query.toString()}`, {
    auth: false,
  })
}

/** 공지 상세. 호출하면 서버에서 조회수가 +1 된다 (별도 증가 API 없음). */
export function getNoticeDetail(id: string | number): Promise<NoticeDetail> {
  return apiFetch<NoticeDetail>(`/api/support/notices/${id}`, { auth: false })
}

/** FAQ 목록. category 를 주면 그 분류만. */
export function getFaqs(category?: string): Promise<FaqResponse[]> {
  const path = category
    ? `/api/support/faqs?category=${encodeURIComponent(category)}`
    : '/api/support/faqs'
  return apiFetch<FaqResponse[]>(path, { auth: false })
}

/** 전화/카카오 채널/운영시간. 이메일 필드는 서버에 없다. */
export function getSiteConfig(): Promise<SiteConfigResponse> {
  return apiFetch<SiteConfigResponse>('/api/support/site-config', { auth: false })
}

/** 1:1 문의 등록. 로그인 필요. */
export function createInquiry(req: InquiryCreateRequest): Promise<InquiryResponse> {
  return apiFetch<InquiryResponse>('/api/support/inquiries', { method: 'POST', body: req })
}

/** 내 문의 목록. 로그인 필요. page 는 0-base. */
export function getMyInquiries(page = 0, size = 10): Promise<SpringPage<InquiryResponse>> {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch<SpringPage<InquiryResponse>>(`/api/support/inquiries/me?${query.toString()}`)
}

/** 문의 상세(+답변). 본인 또는 관리자만. */
export function getInquiryDetail(id: string | number): Promise<InquiryResponse> {
  return apiFetch<InquiryResponse>(`/api/support/inquiries/${id}`)
}
