package com.carematch.terms.domain;

/**
 * 약관 종류. 3종을 각각 별도 레코드로 동의 관리한다.
 * SERVICE(이용약관), PRIVACY(개인정보 수집·이용)는 필수, MARKETING(마케팅 수신)은 선택.
 */
public enum TermsType {
    SERVICE(true),
    PRIVACY(true),
    MARKETING(false);

    private final boolean required;

    TermsType(boolean required) {
        this.required = required;
    }

    public boolean isRequired() {
        return required;
    }
}
