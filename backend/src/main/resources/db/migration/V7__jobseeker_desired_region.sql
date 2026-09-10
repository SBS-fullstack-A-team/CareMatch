-- =============================================================================
-- V7 — 구직자 희망 근무지역 다중화
--   PR: feature/be-talent-desired-regions
--
--   단일 컬럼(desired_sido / desired_sigungu) → 최대 3건의 컬렉션 테이블.
--   프론트 Talent.regions(string[]) 와 정합. 매칭 지역 축은 "희망지역 중 best".
--   기존 단일 값은 새 테이블로 이관 후 컬럼 제거.
-- =============================================================================

create table jobseeker_desired_region (
    jobseeker_profile_id bigint not null,
    sido varchar(30) not null,
    sigungu varchar(30)
);

alter table jobseeker_desired_region
    add constraint fk_jobseeker_desired_region_profile
    foreign key (jobseeker_profile_id) references jobseeker_profile (id);

create index idx_jobseeker_desired_region_sido on jobseeker_desired_region (sido, sigungu);

-- 기존 단일 희망지역 이관 (시/도 있는 행만)
insert into jobseeker_desired_region (jobseeker_profile_id, sido, sigungu)
select id, desired_sido, desired_sigungu
from jobseeker_profile
where desired_sido is not null and desired_sido <> '';

alter table jobseeker_profile drop column desired_sido;
alter table jobseeker_profile drop column desired_sigungu;
