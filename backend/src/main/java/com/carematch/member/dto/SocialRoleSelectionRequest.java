package com.carematch.member.dto;

import com.carematch.member.domain.Role;
import jakarta.validation.constraints.NotNull;

/**
 * 소셜 간편가입 후 회원 유형 확정.
 * role=FACILITY 인 경우 사업자 정보가 필수(서비스에서 검증).
 * role 은 JOBSEEKER / FACILITY 만 허용(ADMIN 불가 — 서비스에서 검증).
 */
public record SocialRoleSelectionRequest(
        @NotNull Role role,

        // 구직자 선택 시(선택 입력)
        String residence,

        // 시설 선택 시(필수)
        String facilityName,
        String businessRegistrationNumber,
        String businessLicenseFileKey
) {
}
