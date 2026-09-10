-- =============================================================================
-- V6 — 구직자 희망 근무 시간대(desiredWorkSchedule) 추가
--   매핑표: docs/ENUM_MAPPING.md §2  ·  PR: feature/be-match-workschedule
--
--   §2 후속. 매칭 스코어의 근무 축을 WorkType(출퇴근/입주) 20점에서
--   WorkType 10 + WorkSchedule(주간/오전/오후/야간/교대) 10 으로 병행 전환한다.
--   구직자가 프로필에서 직접 선택하며, 미설정이면 시간대 축은 채점하지 않는다(NULL 허용).
-- =============================================================================

alter table jobseeker_profile add column desired_work_schedule varchar(20);

alter table jobseeker_profile add constraint jobseeker_profile_desired_work_schedule_check
    check (desired_work_schedule is null
        or desired_work_schedule in ('DAY','MORNING','AFTERNOON','NIGHT','SHIFT'));
