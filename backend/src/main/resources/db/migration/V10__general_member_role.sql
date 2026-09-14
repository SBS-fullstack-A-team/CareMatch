-- =============================================================================
-- V10 — 일반회원(GENERAL) role 추가
--   구직 의사 없이 개인적으로 요양보호사 등을 찾는 소비자 계정.
--   자격증/구직 프로필 없이 member 로우만 생성한다.
--
-- Postgres 인라인 CHECK 는 <table>_<column>_check 로 자동 명명된다.
-- =============================================================================

alter table member drop constraint if exists member_role_check;

alter table member add constraint member_role_check
    check (role in ('JOBSEEKER','FACILITY','ADMIN','GENERAL'));
