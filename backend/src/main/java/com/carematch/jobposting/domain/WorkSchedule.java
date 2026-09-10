package com.carematch.jobposting.domain;

/**
 * 근무 시간대. {@link WorkType}(출퇴근/입주 = "어디서 자느냐")과 다른 축으로,
 * "언제 일하느냐"를 나타낸다. 시설이 등록 폼에서 직접 선택한다.
 *
 * <p>{@code workStartTime}/{@code workEndTime} 은 정밀 표시용으로 별도 유지된다
 * (화면의 "주간 · 09:00~13:00" = WorkSchedule + 시간). "교대"(2/3교대)는 단일
 * 시작·종료 시각으로 표현 불가라 이 enum 이 필요하다.
 *
 * <p>입주형({@code WorkType.LIVE_IN})은 24시간이라 시간대 개념이 없어 null 허용.
 * 매핑표: docs/ENUM_MAPPING.md §2
 */
public enum WorkSchedule {
    DAY,        // 주간
    MORNING,    // 오전
    AFTERNOON,  // 오후
    NIGHT,      // 야간
    SHIFT       // 교대
}
