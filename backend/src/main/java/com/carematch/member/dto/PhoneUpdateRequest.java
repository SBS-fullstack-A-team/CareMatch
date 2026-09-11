package com.carematch.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 내 전화번호 등록/변경 (PUT /api/members/me/phone).
 * 소셜(카카오 등) 가입자는 가입 시 전화번호가 없으므로 이 API로 나중에 입력한다.
 * 등록만으로 인증되는 건 아니다 — 실제 인증은 /api/verifications/{send,verify} 로 별도 진행하고,
 * 요양보호사 등록(자격증 최초 등록) 시점에 CertificateService 가 인증 여부를 확인한다.
 */
public record PhoneUpdateRequest(
        @NotBlank @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다.")
        String phone
) {
}
