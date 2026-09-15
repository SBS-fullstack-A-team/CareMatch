package com.carematch.notification.domain;

import com.carematch.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원 알림. 지원 결과·시설 승인·문의 답변 등 기존 상태 전이 지점에서 서버가 직접 생성한다
 * (실시간 푸시/이메일 없음 — 프론트가 주기적으로 폴링해서 읽음/안읽음을 표시하는 MVP 수준).
 * member 를 연관관계로 물지 않고 memberId 만 저장한다 — 다른 집계 조회에 조인될 일이 없는
 * 단순 이벤트 로그 성격이라 verification_code/contact_unlock_history 와 달리 가볍게 유지.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification", indexes = {
        @Index(name = "idx_notification_member_created", columnList = "member_id, created_at"),
        @Index(name = "idx_notification_member_read", columnList = "member_id, is_read")
})
public class Notification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private NotificationType type;

    @Column(name = "message", nullable = false, length = 300)
    private String message;

    /** 클릭 시 이동할 프론트 경로 (선택). 예: "/mypage/applications" */
    @Column(name = "link", length = 200)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Builder
    private Notification(Long memberId, NotificationType type, String message, String link) {
        this.memberId = memberId;
        this.type = type;
        this.message = message;
        this.link = link;
        this.read = false;
    }

    public void markRead() {
        this.read = true;
    }
}
