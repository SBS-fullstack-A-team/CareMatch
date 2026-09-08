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
 * 구직자(개인회원) 회원가입 요청.
 * 비밀번호 상세 정책(문자/숫자/특수문자 조합)은 서비스 레이어의 PasswordPolicy 에서 검증.
 */
public record JobSeekerSignupRequest(
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

        @Size(max = 200)
        String residence,

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
