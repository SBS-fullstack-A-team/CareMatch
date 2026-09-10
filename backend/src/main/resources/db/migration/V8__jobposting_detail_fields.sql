-- =============================================================================
-- V8 — 구인공고 상세 필드 보강 (docs/JOBPOSTING_FIELDS.md §2·§3·§5)
--   PR: feature/be-jobposting-fields
--
--   프론트 상세/목록 화면이 쓰지만 백엔드에 없던 필드:
--   - requirements / preferences / benefits : 자격요건·우대사항·복리후생 불릿 (콤마 문자열)
--   - min_career_years : 최소 요구 경력(년). null/0 = 경력무관 (목록 카드 태그·매칭)
--   - catchphrase : 스페셜 카드 홍보 문구
--   preferred_note(자유텍스트 1개) 는 preferences 로 이관 후 제거.
--   담당자명은 컬럼 없이 응답에서 시설회원 이름을 노출한다(§1).
-- =============================================================================

alter table job_posting add column requirements varchar(2000);
alter table job_posting add column preferences varchar(2000);
alter table job_posting add column benefits varchar(2000);
alter table job_posting add column min_career_years integer;
alter table job_posting add column catchphrase varchar(100);

update job_posting
   set preferences = preferred_note
 where preferred_note is not null and preferred_note <> '';

alter table job_posting drop column preferred_note;
