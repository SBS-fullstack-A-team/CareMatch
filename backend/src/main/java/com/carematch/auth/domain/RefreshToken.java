package com.carematch.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Refresh Token 저장소 (DB 기반. 추후 Redis 로 교체 가능).
 * 토큰 원문 대신 SHA-256 해시를 저장해 DB 유출 시 재사용을 막는다.
 * 로그아웃 / 재발급(rotation) 시 revoked 처리.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "refresh_token",
        uniqueConstraints = @UniqueConstraint(name = "uk_refresh_token_hash", columnNames = "token_hash"),
        indexes = @Index(name = "idx_refresh_token_member", columnList = "member_id"))
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "token_hash", nullable = false, length = 100)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder
    private RefreshToken(Long memberId, String tokenHash, LocalDateTime expiresAt) {
        this.memberId = memberId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.revoked = false;
        this.createdAt = LocalDateTime.now();
    }

    public boolean isUsable(LocalDateTime now) {
        return !revoked && expiresAt.isAfter(now);
    }

    public void revoke() {
        this.revoked = true;
    }
}
