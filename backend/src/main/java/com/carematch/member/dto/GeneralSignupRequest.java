package com.carematch.member.dto;

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
 * 일반회원(GENERAL) 가입 요청. 구직 의사 없이 개인적으로 요양보호사 등을 찾는
 * 소비자 계정 — 자격증/구직 프로필이 없다는 점만 빼면 {@link JobSeekerSignupRequest}와 동일한 형태.
 */
public record GeneralSignupRequest(
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

        // --- 이메일 또는 휴대폰 인증 (둘 중 하나 필수) ---
        @NotNull
        VerificationChannel verificationChannel,
        @NotBlank
        String verificationTarget,

        // --- 약관 3종 동의 (서버 재검증) ---
        @NotEmpty @Valid
        List<TermsAgreementRequest> agreements
) {
}
