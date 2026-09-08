package com.carematch.member.dto;

import com.carematch.terms.domain.TermsType;
import jakarta.validation.constraints.NotNull;

/**
 * 회원가입 시 약관 동의 1건. 프론트가 보낸 값을 서버에서 재검증한다.
 *
 * @param type    약관 종류
 * @param version 동의한 약관 버전(현재 active 버전과 일치해야 유효)
 * @param agreed  동의 여부
 */
public record TermsAgreementRequest(
        @NotNull TermsType type,
        @NotNull String version,
        boolean agreed
) {
}
