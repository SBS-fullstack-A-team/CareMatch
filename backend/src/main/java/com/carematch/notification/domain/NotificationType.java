package com.carematch.notification.domain;

/** 알림 종류. 프론트가 아이콘/문구를 분기하는 용도 (한글 라벨은 프론트 소유). */
public enum NotificationType {
    APPLICATION_ACCEPTED,
    APPLICATION_REJECTED,
    FACILITY_APPROVED,
    FACILITY_REJECTED,
    INQUIRY_ANSWERED
}
