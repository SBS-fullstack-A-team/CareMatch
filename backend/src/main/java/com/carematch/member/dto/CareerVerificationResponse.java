package com.carematch.member.dto;

import com.carematch.badge.domain.CareerVerification;

import java.time.LocalDate;

/**
 * 경력 인증 응답. status 는 PENDING/APPROVED/REJECTED — "인증구직자" 마크 요건 중 하나.
 */
public record CareerVerificationResponse(
        Long id,
        String organizationName,
        String roleTitle,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        String status,
        String rejectReason
) {
    public static CareerVerificationResponse from(CareerVerification c) {
        return new CareerVerificationResponse(c.getId(), c.getOrganizationName(), c.getRoleTitle(),
                c.getStartDate(), c.getEndDate(), c.getDescription(), c.getStatus().name(), c.getRejectReason());
    }
}
