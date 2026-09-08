package com.carematch.auth.dto;

import jakarta.validation.constraints.NotBlank;

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
