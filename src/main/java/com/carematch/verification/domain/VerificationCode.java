package com.carematch.verification.domain;

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

import java.time.LocalDateTime;

/**
 * 이메일/휴대폰 인증코드. 실제 발송은 MVP 에서 목업(로그 출력).
 * 같은 대상(target)에 재요청 시 기존 미인증 레코드를 만료시키고 새로 발급.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "verification_code", indexes = {
        @Index(name = "idx_verification_target", columnList = "channel, target")
})
public class VerificationCode extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 10)
    private VerificationChannel channel;

    /** 이메일 주소 또는 휴대폰 번호(숫자만). */
    @Column(name = "target", nullable = false, length = 150)
    private String target;

    @Column(name = "code", nullable = false, length = 10)
    private String code;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified", nullable = false)
    private boolean verified;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Builder
    private VerificationCode(VerificationChannel channel, String target, String code, LocalDateTime expiresAt) {
        this.channel = channel;
        this.target = target;
        this.code = code;
        this.expiresAt = expiresAt;
        this.verified = false;
        this.attemptCount = 0;
    }

    public boolean isExpired(LocalDateTime now) {
        return expiresAt.isBefore(now);
    }

    public void increaseAttempt() {
        this.attemptCount++;
    }

    public void markVerified() {
        this.verified = true;
    }

    public void expireNow() {
        this.expiresAt = LocalDateTime.now().minusSeconds(1);
    }
}
