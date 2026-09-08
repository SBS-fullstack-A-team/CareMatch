package com.carematch.verification.dto;

import com.carematch.verification.domain.VerificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public final class VerificationDtos {

    private VerificationDtos() {
    }

    public record SendCodeRequest(
            @NotNull VerificationChannel channel,
            @NotBlank String target
    ) {
    }

    public record SendCodeResponse(
            String channel,
            String target,
            OffsetDateTime expiresAt,
            String devCodeHint   // 개발 편의: local 프로필에서만 채움. prod 에서는 null.
    ) {
    }

    public record VerifyCodeRequest(
            @NotNull VerificationChannel channel,
            @NotBlank String target,
            @NotBlank String code
    ) {
    }

    public record VerifyCodeResponse(
            boolean verified
    ) {
    }
}
