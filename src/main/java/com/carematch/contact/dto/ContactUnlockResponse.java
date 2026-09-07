package com.carematch.contact.dto;

import java.time.OffsetDateTime;

/**
 * 연락처 열람 결과(언마스크된 값).
 *
 * @param free        기존 열람 이력이 있어 무료로 제공된 경우 true
 * @param pointsSpent 이번 요청으로 차감된 포인트(무료면 0)
 */
public record ContactUnlockResponse(
        Long profileId,
        String phone,
        String residence,
        boolean free,
        int pointsSpent,
        OffsetDateTime unlockedAt
) {
}
