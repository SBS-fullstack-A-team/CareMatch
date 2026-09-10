-- =============================================================================
-- V2 — 회원 화면 표시 설정 (쉬운 화면 모드 / 글자 크기)
--   엔티티: Member.easyMode, Member.fontScale (FontScale enum)
--   PR: feature/be-display-preference
--
-- 기존 행(관리자 계정 등)에도 값이 필요하므로 DEFAULT 를 지정한다.
-- ADD COLUMN 을 문장별로 분리 (Postgres 는 다중 절도 되지만 H2 스모크 테스트 호환).
-- =============================================================================

alter table member add column easy_mode boolean not null default false;

alter table member add column font_scale varchar(10) not null default 'NORMAL';

alter table member add constraint member_font_scale_check check (font_scale in ('NORMAL', 'LARGE', 'XLARGE'));
