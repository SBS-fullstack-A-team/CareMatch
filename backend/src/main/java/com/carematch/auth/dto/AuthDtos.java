package com.carematch.auth.dto;

import com.carematch.verification.domain.VerificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 인증 관련 요청/응답 DTO 모음.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank String loginId,
            @NotBlank String password
    ) {
    }

    /**
     * 비밀번호 재설정. 사전에 {@code /api/verifications/send}+{@code /verify} 로
     * loginId 소유자 본인의 이메일/휴대폰을 인증해뒀어야 한다 (회원가입과 동일한 인증코드 인프라 재사용).
     */
    public record PasswordResetRequest(
            @NotBlank String loginId,
            @NotNull VerificationChannel verificationChannel,
            @NotBlank String verificationTarget,
            @NotBlank String newPassword
    ) {
    }

    public record RefreshRequest(
            @NotBlank String refreshToken
    ) {
    }

    public record LogoutRequest(
            @NotBlank String refreshToken
    ) {
    }

    /**
     * @param accessToken          JWT 액세스 토큰
     * @param refreshToken         JWT 리프레시 토큰
     * @param tokenType            항상 "Bearer"
     * @param accessTokenExpiresIn 액세스 토큰 만료까지 남은 초
     * @param roleSelected         회원 유형(구직자/시설) 선택 완료 여부. false 면 프론트가 유형 선택 화면으로.
     */
    public record TokenResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long accessTokenExpiresIn,
            boolean roleSelected
    ) {
        public static TokenResponse of(String access, String refresh, long expiresIn, boolean roleSelected) {
            return new TokenResponse(access, refresh, "Bearer", expiresIn, roleSelected);
        }
    }
}
