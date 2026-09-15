package com.carematch.point.dto;

public record PointChargeCompleteResponse(
        long chargedAmount,
        long balance
) {
}
