package com.carematch.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        MemberResponse member
) {
}
