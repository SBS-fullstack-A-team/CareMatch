package com.carematch.member.domain;

/**
 * 구직자가 수행 가능한 돌봄 업무 항목. 인재 검색 필터(다중) / 상세 표시용.
 * 구인공고의 {@code duties}(자유 문자열)와 달리 검색을 위해 고정 enum 으로 둔다.
 */
public enum CareTask {
    DAILY_LIFE_SUPPORT,   // 일상생활지원
    MEAL_SUPPORT,         // 식사도움
    BATH_SUPPORT,         // 목욕도움
    MOBILITY_SUPPORT,     // 이동도움
    COGNITIVE_ACTIVITY,   // 인지활동지원
    PERSONAL_HYGIENE,     // 개인위생관리
    HOUSEWORK,            // 가사지원
    HOSPITAL_ESCORT       // 병원동행
}
