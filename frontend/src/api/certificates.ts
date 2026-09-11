/** 자격증 API (마이페이지 읽기 전용). docs/API.md, CertificateController */
import { apiFetch } from '@/lib/api-client'
import type { CertificateDetailResponse } from '@/types/api'

/** 내 자격증 목록. 페이지네이션 없이 배열로 온다. */
export function getMyCertificates(): Promise<CertificateDetailResponse[]> {
  return apiFetch<CertificateDetailResponse[]>('/api/certificates/me')
}
