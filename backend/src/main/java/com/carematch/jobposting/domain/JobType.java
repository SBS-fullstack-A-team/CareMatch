package com.carematch.jobposting.domain;

/**
 * 직종. enum name 이 프론트·API 계약값이며, 한글 라벨은 프론트가 보유한다.
 * 매핑표: docs/ENUM_MAPPING.md §1
 */
public enum JobType {
    CAREGIVER,       // 요양보호사 — 국가자격 요양보호사
    CARE_ATTENDANT,  // 간병인 — 병원·시설 간병(비자격 포함). 구 NURSING_ASSISTANT
    NURSE_AIDE,      // 간호조무사 — 국가자격 간호조무사
    SOCIAL_WORKER,   // 사회복지사 — 센터 상담·케이스 관리
    LIFE_SUPPORT,    // 생활지원사 — 노인맞춤돌봄서비스 안부확인·가사지원
    HOUSEKEEPER,     // 가사도우미 — 가정 내 가사 지원
    ETC              // 기타
}
