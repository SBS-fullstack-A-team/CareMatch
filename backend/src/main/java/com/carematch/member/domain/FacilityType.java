package com.carematch.member.domain;

/**
 * 시설 유형. 시설회원이 가입 시 선택한다. enum name 이 프론트·API 계약값이며,
 * 한글 라벨은 프론트가 보유한다. 매핑표: docs/ENUM_MAPPING.md §4
 */
public enum FacilityType {
    VISITING_CARE,     // 방문요양센터
    NURSING_HOME,      // 요양원
    DAY_NIGHT_CARE,    // 주야간보호센터
    COMMUNITY_CARE,    // 재가복지센터
    NURSING_HOSPITAL,  // 요양병원
    ETC                // 기타
}
