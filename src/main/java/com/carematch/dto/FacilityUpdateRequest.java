package com.carematch.dto;

import com.carematch.entity.FacilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** 시설 회원 프로필 등록/수정 요청 (PATCH /api/members/me/facility). */
public record FacilityUpdateRequest(
        @NotBlank String facilityName,
        @NotNull FacilityType facilityType,
        @NotBlank String managerName,
        String managerPosition,
        @NotBlank String facilityAddress
) {
}
