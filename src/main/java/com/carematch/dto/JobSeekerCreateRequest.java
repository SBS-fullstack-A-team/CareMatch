package com.carematch.dto;

import jakarta.validation.constraints.NotBlank;

public record JobSeekerCreateRequest(
        @NotBlank String name,
        @NotBlank String region,
        @NotBlank String residenceRegion,
        String desiredJobType,
        String career,
        Integer desiredPay
) {
}
