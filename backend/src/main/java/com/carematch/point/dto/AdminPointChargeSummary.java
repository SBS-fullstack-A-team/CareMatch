package com.carematch.point.dto;

import com.carematch.point.PointCharge;

import java.time.LocalDateTime;

/** 관리자 포인트충전관리 목록 한 줄. */
public record AdminPointChargeSummary(
        Long id,
        Long memberId,
        String memberName,
        String memberLoginId,
        String paymentId,
        long amount,
        String status,
        LocalDateTime createdAt,
        LocalDateTime completedAt
) {
    public static AdminPointChargeSummary from(PointCharge c) {
        return new AdminPointChargeSummary(
                c.getId(),
                c.getMember().getId(),
                c.getMember().getName(),
                c.getMember().getLoginId(),
                c.getPaymentId(),
                c.getAmount(),
                c.getStatus().name(),
                c.getCreatedAt(),
                c.getCompletedAt());
    }
}
