package com.carematch.badge.dto;

import java.time.LocalDateTime;

public final class BadgeRequestDtos {

    private BadgeRequestDtos() {
    }

    public record BadgeRequestResponse(
            Long id,
            String status,
            LocalDateTime requestedAt,
            LocalDateTime decidedAt,
            String rejectReason
    ) {
    }
}
