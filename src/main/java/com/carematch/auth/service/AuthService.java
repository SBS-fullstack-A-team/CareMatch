package com.carematch.auth.service;

import com.carematch.auth.dto.AuthDtos.TokenResponse;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import com.carematch.security.jwt.JwtProperties;
import com.carematch.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 로그인 / 토큰 재발급 / 로그아웃.
 * - 로그인 실패 누적 시 계정 잠금(설정: carematch.security.login.*)
 * - Access(짧게) + Refresh(길게, DB 해시 저장) 발급, 재발급 시 Refresh rotation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptRecorder loginAttemptRecorder;

    @Transactional
    public TokenResponse login(String loginId, String rawPassword) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (member.isLocked(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (!member.isActive()) {
            throw new BusinessException(ErrorCode.ACCOUNT_NOT_ACTIVE);
        }
        if (member.getPassword() == null || !passwordEncoder.matches(rawPassword, member.getPassword())) {
            // 실패 카운트/잠금은 이 트랜잭션이 롤백돼도 남아야 하므로 별도 트랜잭션에 기록
            loginAttemptRecorder.recordFailure(member.getId());
            log.warn("[login] 비밀번호 불일치 memberId={}", member.getId());
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (member.getLoginFailCount() > 0 || member.getAccountLockedUntil() != null) {
            member.resetLoginFail();
        }
        return issueTokens(member);
    }

    @Transactional
    public TokenResponse reissue(String refreshToken) {
        Long memberId = refreshTokenService.validateAndRotate(refreshToken);
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (!member.isActive()) {
            throw new BusinessException(ErrorCode.ACCOUNT_NOT_ACTIVE);
        }
        return issueTokens(member);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    /** 소셜 로그인 성공 핸들러에서도 재사용. */
    @Transactional
    public TokenResponse issueTokens(Member member) {
        String roleAuthority = member.isRoleSelected() ? member.getRole().authority() : JwtTokenProvider.GUEST_ROLE;
        String access = tokenProvider.createAccessToken(member.getId(), roleAuthority);
        String refresh = tokenProvider.createRefreshToken(member.getId());
        refreshTokenService.save(member.getId(), refresh,
                LocalDateTime.now().plus(tokenProvider.refreshTokenValidity()));
        return TokenResponse.of(access, refresh,
                jwtProperties.accessTokenValiditySeconds(), member.isRoleSelected());
    }
}
