package com.carematch.badge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public final class CareerVerificationDtos {

    private CareerVerificationDtos() {
    }

    /** 경력 인증 신청. 파일 증빙 없이 텍스트만 받는다 — 관리자가 내용을 보고 승인/반려. */
    public record CreateCareerVerificationRequest(
            @NotBlank String organizationName,
            String roleTitle,
            @NotNull LocalDate startDate,
            /** null 이면 재직중. */
            LocalDate endDate,
            String description
    ) {
    }

    public record CareerVerificationDetailResponse(
            Long id,
            String organizationName,
            String roleTitle,
            LocalDate startDate,
            LocalDate endDate,
            String description,
            String status,
            String rejectReason
    ) {
    }
}
