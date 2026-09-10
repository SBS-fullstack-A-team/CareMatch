-- =============================================================================
-- V5 — 시설 유형(FacilityType) 추가
--   매핑표: docs/ENUM_MAPPING.md §4  ·  PR: feature/be-facility-type-applicant
--
--   시설회원이 가입 시 선택. 프론트 공고 카드/필터의 시설유형 배지에 대응.
--   V5 이전 가입 시설은 NULL (관리자가 채우거나 프로필 수정 시 입력).
-- =============================================================================

alter table facility_profile add column facility_type varchar(30);

alter table facility_profile add constraint facility_profile_facility_type_check
    check (facility_type is null
        or facility_type in ('VISITING_CARE','NURSING_HOME','DAY_NIGHT_CARE',
                             'COMMUNITY_CARE','NURSING_HOSPITAL','ETC'));
