/** 약관 API. docs/API.md §5 (공개 조회) */
import { apiFetch } from '@/lib/api-client'
import type { TermsResponse, TermsTypeName } from '@/types/api'

/**
 * 현재 유효한 약관 3종 요약 (본문 제외).
 * 회원가입 시 보내는 agreements 의 version 은 반드시 이 응답값을 그대로 써야 한다.
 * (다르면 서버가 TERMS_REAGREEMENT_REQUIRED 로 거절한다)
 */
export function getTerms(): Promise<TermsResponse[]> {
  return apiFetch<TermsResponse[]>('/api/terms', { auth: false })
}

/** 특정 약관 본문 포함 조회 */
export function getTermsDetail(type: TermsTypeName): Promise<TermsResponse> {
  return apiFetch<TermsResponse>(`/api/terms/${type}`, { auth: false })
}
