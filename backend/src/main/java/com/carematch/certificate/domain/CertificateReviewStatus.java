package com.carematch.certificate.domain;

/**
 * 자격증 진위에 대한 관리자 심사 상태.
 * {@link CertificateStatus} 와 별개 축 — 그쪽은 업로드 파일 자체의 기술적 검증(존재/크기/확장자),
 * 이쪽은 사람이 내용을 보고 진짜 자격증인지 판단한 결과.
 */
public enum CertificateReviewStatus {
    PENDING,
    APPROVED,
    REJECTED
}
