package com.carematch.certificate.domain;

public enum CertificateStatus {
    /** 업로드 URL 발급됨, 실제 파일 검증 전 */
    PENDING,
    /** 파일 존재/크기/확장자 검증 완료 */
    VERIFIED,
    /** 검증 실패(파일 없음/형식 위반 등) */
    REJECTED
}
