/**
 * 인증구직자 마크 API — 경력 인증 + 마크 신청. 구직자 본인만 (백엔드 hasRole('JOBSEEKER')).
 *
 * 마크가 붙는 순서:
 *   자격증 등록 → 관리자 진위 승인 ┐
 *   경력 인증 신청 → 관리자 승인   ┴→ 마크 신청 → 관리자 최종 승인 → verifiedBadge = true
 */
import { apiFetch } from '@/lib/api-client'
import type {
  BadgeRequestResponse,
  CareerVerificationDetailResponse,
  CreateCareerVerificationRequest,
} from '@/types/api'

/** 내 경력 인증 목록. 페이지네이션 없이 배열로 온다. */
export function getMyCareerVerifications(): Promise<CareerVerificationDetailResponse[]> {
  return apiFetch<CareerVerificationDetailResponse[]>('/api/career-verifications/me')
}

/** 경력 인증 신청. 자격증과 달리 파일 증빙 없이 텍스트만 — 관리자가 내용을 보고 승인/반려한다. */
export function createCareerVerification(
  req: CreateCareerVerificationRequest,
): Promise<CareerVerificationDetailResponse> {
  return apiFetch<CareerVerificationDetailResponse>('/api/career-verifications', {
    method: 'POST',
    body: req,
  })
}

export function deleteCareerVerification(careerVerificationId: number): Promise<void> {
  return apiFetch<void>(`/api/career-verifications/${careerVerificationId}`, { method: 'DELETE' })
}

/** 내 마크 신청 이력 (최신순). */
export function getMyBadgeRequests(): Promise<BadgeRequestResponse[]> {
  return apiFetch<BadgeRequestResponse[]>('/api/badge-requests/me')
}

/**
 * 마크 신청. 승인된 자격증 1건 이상 + 승인된 경력 1건 이상이어야 한다.
 * 요건 미달·중복 신청·이미 보유한 경우 서버가 400 대역 ApiError 를 던진다.
 */
export function requestVerifiedBadge(): Promise<BadgeRequestResponse> {
  return apiFetch<BadgeRequestResponse>('/api/badge-requests', { method: 'POST' })
}
