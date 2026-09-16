-- =============================================================================
-- V14 — 경력 인증 증빙 파일
--   경력 인증(career_verification)은 지금까지 텍스트만 받았다. 실제 인증처럼 재직·경력
--   증명서를 첨부할 수 있도록 파일 key 컬럼을 추가한다.
--   (업로드 자체는 기존 인프라 재사용: POST /api/files/upload-url purpose=CAREER_PROOF)
--
--   기존 행에는 파일이 없으므로 nullable. 신규 신청은 DTO(@NotBlank fileKey)에서 강제한다.
-- =============================================================================

alter table career_verification add column file_key varchar(500);
