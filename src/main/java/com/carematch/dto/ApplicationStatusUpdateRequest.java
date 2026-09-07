package com.carematch.dto;

import jakarta.validation.constraints.NotBlank;

public record ApplicationStatusUpdateRequest(
        @NotBlank String status
) {
}
