/** 자격증 API. docs/API.md, CertificateController — 구직자 본인만. */
import { apiFetch } from '@/lib/api-client'
import type { CertificateDetailResponse, CreateCertificateRequest } from '@/types/api'

/** 내 자격증 목록. 페이지네이션 없이 배열로 온다. */
export function getMyCertificates(): Promise<CertificateDetailResponse[]> {
  return apiFetch<CertificateDetailResponse[]>('/api/certificates/me')
}

/**
 * 자격증 등록. fileKey 는 먼저 @/lib/file-upload 의 uploadFile() 로 업로드까지 마친 값.
 * 휴대폰 인증이 안 돼 있으면 ApiError(code: 'MEMBER_005') — 호출부가 인증 유도로 처리한다.
 */
export function createCertificate(req: CreateCertificateRequest): Promise<CertificateDetailResponse> {
  return apiFetch<CertificateDetailResponse>('/api/certificates', { method: 'POST', body: req })
}

/** 업로드 완료 후 파일 검증(존재/크기/확장자) — 등록 직후 한 번 호출해 최종 상태를 받는다. */
export function verifyCertificate(certificateId: number): Promise<CertificateDetailResponse> {
  return apiFetch<CertificateDetailResponse>(`/api/certificates/${certificateId}/verify`, {
    method: 'POST',
  })
}

export function deleteCertificate(certificateId: number): Promise<void> {
  return apiFetch<void>(`/api/certificates/${certificateId}`, { method: 'DELETE' })
}
