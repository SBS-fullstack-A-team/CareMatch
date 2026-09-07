package com.carematch.dto;

import jakarta.validation.constraints.Positive;

public record PointChargeRequest(
        @Positive Integer amount
) {
}
