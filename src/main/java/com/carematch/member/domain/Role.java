package com.carematch.member.domain;

/**
 * 회원 권한. Spring Security 권한 문자열은 "ROLE_" 접두사를 붙여 사용한다.
 * 소셜 최초 로그인 후 유형 미선택 상태는 role = null 로 표현하고
 * 인증 시 임시로 ROLE_GUEST 권한만 부여한다(별도 enum 값 두지 않음).
 */
public enum Role {
    JOBSEEKER,
    FACILITY,
    ADMIN;

    public String authority() {
        return "ROLE_" + name();
    }
}
