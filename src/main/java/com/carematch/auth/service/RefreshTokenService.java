package com.carematch.auth.service;

import com.carematch.auth.domain.RefreshToken;
import com.carematch.auth.repository.RefreshTokenRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * Refresh Token 저장/검증/무효화. 원문 대신 SHA-256 해시만 저장한다.
 * (DB 기반. 추후 Redis 구현체로 교체 가능하도록 이 서비스 뒤로 캡슐화)
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public void save(Long memberId, String rawToken, LocalDateTime expiresAt) {
        refreshTokenRepository.save(RefreshToken.builder()
                .memberId(memberId)
                .tokenHash(hash(rawToken))
                .expiresAt(expiresAt)
                .build());
    }

    /**
     * 재발급 시 기존 토큰을 검증하고 무효화(rotation).
     * @return 토큰 소유자 memberId
     */
    @Transactional
    public Long validateAndRotate(String rawToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
        if (!stored.isUsable(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND, "expired or revoked");
        }
        stored.revoke();
        return stored.getMemberId();
    }

    /** 로그아웃: 제시된 토큰 1건 무효화. 없어도 조용히 통과(멱등). */
    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken))
                .ifPresent(RefreshToken::revoke);
    }

    @Transactional
    public void revokeAll(Long memberId) {
        refreshTokenRepository.revokeAllByMemberId(memberId);
    }

    private String hash(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
