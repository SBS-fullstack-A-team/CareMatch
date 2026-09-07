package com.carematch.dto;

import com.carematch.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SignUpRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String name,
        @NotBlank String phone,
        @NotBlank String role,
        // EMPLOYER(시설) 가입 시에만 필수 — MemberService에서 검증
        String businessRegistrationNumber
) {
    public Role roleAsEnum() {
        return Role.valueOf(role);
    }
}
