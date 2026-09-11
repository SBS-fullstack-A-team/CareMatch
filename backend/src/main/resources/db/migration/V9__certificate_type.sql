-- =============================================================================
-- V9 — 자격증 종류(CertificateType) 신설 (docs/ENUM_MAPPING.md §5)
--   PR: feature/be-certificate-type
--
--   자유 입력 문자열(certificate_name) 정확 일치로 검색하던 자격증 필터를
--   enum(certificate_type) 기준으로 전환. certificate_name 은 표시용으로 유지
--   (정형 종류 = 라벨, OTHER = 사용자 입력).
--   기존 행은 전부 OTHER 로 백필 — 이름은 그대로 보존된다.
--
-- Postgres 인라인 CHECK 는 <table>_<column>_check 로 자동 명명된다.
-- =============================================================================

alter table certificate add column certificate_type varchar(30);

update certificate set certificate_type = 'OTHER' where certificate_type is null;

alter table certificate alter column certificate_type set not null;

alter table certificate add constraint certificate_certificate_type_check
    check (certificate_type in ('CAREGIVER','NURSE_AIDE','SOCIAL_WORKER_1','SOCIAL_WORKER_2',
                               'CARE_ASSISTANT','DRIVER_LICENSE','OTHER'));
