/**
 * 파일 업로드 플로우 (issue-url → 직접 PUT → confirm). CertificateController 주석의
 * "파일은 먼저 POST /api/files/upload-url 로 올린 뒤 fileKey 로 등록" 순서를 그대로 구현한다.
 *
 * 허용 타입/용량은 backend application.yml 의 carematch.storage.* 기본값과 맞춘다
 * (allowed-content-types, max-upload-size-bytes) — 서버가 최종 검증하므로 여기 값은
 * 사용자에게 빠르게 알려주기 위한 보조 검증일 뿐이다.
 */
import { confirmUpload, issueUploadUrl } from '@/api/files'
import type { FileMetadata, FilePurpose } from '@/types/api'

export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const ACCEPT_ATTR = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'

export class FileUploadError extends Error {}

export function validateFile(file: File): string | null {
  if (!ALLOWED_CONTENT_TYPES.includes(file.type as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    return '이미지(jpg, png) 또는 PDF 파일만 첨부할 수 있습니다.'
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return '파일 용량은 5MB 이하만 첨부할 수 있습니다.'
  }
  return null
}

export interface UploadedFile {
  fileKey: string
  meta: FileMetadata
}

/**
 * 업로드 전 과정을 한 번에 처리한다: URL 발급 → 스토리지로 직접 PUT → 업로드 확인.
 * 3단계 모두 실패하면 FileUploadError 를 던진다 (ApiError 는 그대로 전파해 호출부가
 * 서버 메시지를 보여줄 수 있게 한다. 단, 2단계 PUT 실패는 백엔드를 거치지 않으므로 여기서 감싼다).
 */
export async function uploadFile(file: File, purpose: FilePurpose): Promise<UploadedFile> {
  const invalidReason = validateFile(file)
  if (invalidReason) throw new FileUploadError(invalidReason)

  const issued = await issueUploadUrl(purpose, file.name, file.type)

  // 스토리지 벤더 미확정 구간(StubFileStorageService)은 실제로 받아줄 서버가 없는
  // 더미 URL(`/_stub-upload/...`)을 내려준다 — PUT을 시도할 필요가 없다(어차피 confirm도
  // 항상 더미 메타로 통과시킨다). carematch.storage.provider=r2 로 바뀌면 이 마커가 사라지고
  // 아래 실제 PUT 경로를 그대로 탄다.
  const isStubUpload = issued.uploadUrl.includes('/_stub-upload/')
  if (!isStubUpload) {
    let putRes: Response
    try {
      putRes = await fetch(issued.uploadUrl, {
        method: issued.httpMethod || 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
    } catch {
      throw new FileUploadError('파일 업로드 중 네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    }
    if (!putRes.ok) {
      throw new FileUploadError('파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const meta = await confirmUpload(issued.fileKey)
  return { fileKey: issued.fileKey, meta }
}
