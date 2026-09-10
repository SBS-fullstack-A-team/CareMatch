-- =============================================================================
-- V4 — 구인공고 근무 시간대(WorkSchedule) 추가
--   매핑표: docs/ENUM_MAPPING.md §2  ·  PR: feature/be-workschedule
--
--   WorkType(출퇴근/입주 = "어디서 자느냐")과 다른 축의 "언제 일하느냐".
--   주간/오전/오후/야간/교대. 입주형은 시간대 개념이 없어 NULL 허용.
--   기존 행은 NULL 로 남는다 (프론트는 시간대 미표기 시 시각만 노출).
-- =============================================================================

alter table job_posting add column work_schedule varchar(20);

alter table job_posting add constraint job_posting_work_schedule_check
    check (work_schedule is null
        or work_schedule in ('DAY','MORNING','AFTERNOON','NIGHT','SHIFT'));
