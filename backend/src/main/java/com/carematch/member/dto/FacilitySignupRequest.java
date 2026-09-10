package com.carematch.member.dto;

import com.carematch.member.domain.FacilityType;
import com.carematch.verification.domain.VerificationChannel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 시설(기업회원) 회원가입 요청.
 * 사업자등록증 파일은 백엔드가 직접 받지 않는다.
 *  → 먼저 POST /api/files/upload-url 로 businessLicenseFileKey 를 발급받아 여기에 담아 보낸다.
 * 가입 직후 승인상태 PENDING. 관리자 승인 전까지 인재 열람/공고 등록 차단.
 */
public record FacilitySignupRequest(
        @NotBlank @Size(min = 4, max = 20)
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "아이디는 영문/숫자/밑줄만 사용할 수 있습니다.")
        String loginId,

        @NotBlank @Size(min = 8, max = 64)
        String password,

        @NotBlank @Email
        String email,

        @NotBlank @Size(max = 50)
        String name,

        @NotBlank @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다.")
        String phone,

        @NotBlank @Size(max = 100)
        String facilityName,

        @NotNull
        FacilityType facilityType,

        @NotBlank
        @Pattern(regexp = "^\\d{3}-?\\d{2}-?\\d{5}$", message = "사업자등록번호는 10자리 숫자여야 합니다.")
        String businessRegistrationNumber,

        /** POST /api/files/upload-url 에서 발급받은 스토리지 키. */
        @NotBlank
        String businessLicenseFileKey,

        @NotNull
        VerificationChannel verificationChannel,
        @NotBlank
        String verificationTarget,

        @NotEmpty @Valid
        List<TermsAgreementRequest> agreements
) {
}
