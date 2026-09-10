-- =============================================================================
-- V3 — 직종(JobType) enum 재정의
--   매핑표: docs/ENUM_MAPPING.md §1  ·  PR: feature/be-jobtype-enum
--
--   NURSING_ASSISTANT (enum 이름은 "간호조무사"였으나 실제 의미는 "간병인")
--     → CARE_ATTENDANT 로 리네임
--   NURSE_AIDE (간호조무사), SOCIAL_WORKER (사회복지사) 추가
--   CAREGIVER / LIFE_SUPPORT / HOUSEKEEPER / ETC 유지
--
-- Postgres 인라인 CHECK 는 <table>_<column>_check 로 자동 명명된다.
-- 순서: 제약 drop → 데이터 UPDATE → 신규 값 목록으로 제약 재생성.
-- 인덱스 idx_job_posting_status_region(status, sigungu, job_type) 는
-- 값 변경만 있으므로 재생성 불필요 (컬럼 타입·이름 그대로).
-- =============================================================================

-- 1) job_posting.job_type
alter table job_posting drop constraint if exists job_posting_job_type_check;

update job_posting set job_type = 'CARE_ATTENDANT' where job_type = 'NURSING_ASSISTANT';

alter table job_posting add constraint job_posting_job_type_check
    check (job_type in ('CAREGIVER','CARE_ATTENDANT','NURSE_AIDE','SOCIAL_WORKER','LIFE_SUPPORT','HOUSEKEEPER','ETC'));

-- 2) jobseeker_profile.desired_job_type
alter table jobseeker_profile drop constraint if exists jobseeker_profile_desired_job_type_check;

update jobseeker_profile set desired_job_type = 'CARE_ATTENDANT' where desired_job_type = 'NURSING_ASSISTANT';

alter table jobseeker_profile add constraint jobseeker_profile_desired_job_type_check
    check (desired_job_type in ('CAREGIVER','CARE_ATTENDANT','NURSE_AIDE','SOCIAL_WORKER','LIFE_SUPPORT','HOUSEKEEPER','ETC'));
