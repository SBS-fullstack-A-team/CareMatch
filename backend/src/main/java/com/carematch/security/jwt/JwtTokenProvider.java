package com.carematch.security.jwt;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

/**
 * JWT 발급/검증. HS256 대칭키.
 * - Access: 짧은 만료. role 클레임 포함.
 * - Refresh: 긴 만료. jti(랜덤) 포함해 매 발급마다 유일. 원문은 DB 에 해시로만 저장.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TYPE = "typ";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    /** 소셜 최초 로그인 후 유형 미선택 회원의 임시 권한. */
    public static final String GUEST_ROLE = "ROLE_GUEST";

    private final SecretKey key;
    private final JwtProperties props;

    public JwtTokenProvider(JwtProperties props) {
        byte[] secretBytes = props.secret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("carematch.jwt.secret 는 최소 32바이트 이상이어야 합니다.");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.props = props;
    }

    public String createAccessToken(Long memberId, String roleAuthority) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + props.accessTokenValiditySeconds() * 1000);
        return Jwts.builder()
                .issuer(props.issuer())
                .subject(String.valueOf(memberId))
                .claim(CLAIM_ROLE, roleAuthority == null ? GUEST_ROLE : roleAuthority)
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    public String createRefreshToken(Long memberId) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + props.refreshTokenValiditySeconds() * 1000);
        return Jwts.builder()
                .issuer(props.issuer())
                .subject(String.valueOf(memberId))
                .id(UUID.randomUUID().toString())
                .claim(CLAIM_TYPE, TYPE_REFRESH)
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    public Duration refreshTokenValidity() {
        return Duration.ofSeconds(props.refreshTokenValiditySeconds());
    }

    /**
     * 서명/만료 검증 후 Claims 반환. 실패 시 BusinessException.
     */
    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(props.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (BusinessException e) {
            return false;
        }
    }

    public Long getMemberId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public String getRoleAuthority(Claims claims) {
        return claims.get(CLAIM_ROLE, String.class);
    }

    public boolean isAccessToken(Claims claims) {
        return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public boolean isRefreshToken(Claims claims) {
        return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
    }
}
