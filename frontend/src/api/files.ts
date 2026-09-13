/**
 * 파일 업로드 URL 발급/확인 API. docs/API.md, FileController.
 * 실제 업로드(파일 바이트 PUT)는 백엔드를 거치지 않는다 — @/lib/file-upload 의 uploadFile() 참고.
 */
import { apiFetch } from '@/lib/api-client'
import type {
  ConfirmUploadRequest,
  FileMetadata,
  FilePurpose,
  IssueUploadUrlRequest,
  UploadUrlResponse,
} from '@/types/api'

/** 업로드용 임시 URL 발급 (만료시간 있음). */
export function issueUploadUrl(
  purpose: FilePurpose,
  originalFilename: string,
  contentType: string,
): Promise<UploadUrlResponse> {
  const body: IssueUploadUrlRequest = { purpose, originalFilename, contentType }
  return apiFetch<UploadUrlResponse>('/api/files/upload-url', { method: 'POST', body })
}

/** 업로드 완료 후 존재/크기/타입 확인. */
export function confirmUpload(fileKey: string): Promise<FileMetadata> {
  const body: ConfirmUploadRequest = { fileKey }
  return apiFetch<FileMetadata>('/api/files/confirm', { method: 'POST', body })
}
