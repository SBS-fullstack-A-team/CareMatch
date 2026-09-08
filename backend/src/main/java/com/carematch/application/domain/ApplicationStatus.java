package com.carematch.application.domain;

/** 구직 지원 상태. */
public enum ApplicationStatus {
    APPLIED,    // 지원 완료 (검토 대기)
    ACCEPTED,   // 시설이 수락
    REJECTED,   // 시설이 반려
    CANCELED    // 지원자가 취소
}
