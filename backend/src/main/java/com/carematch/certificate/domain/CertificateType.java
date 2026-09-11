package com.carematch.certificate.domain;

/**
 * 자격증 종류. 인재 검색 필터의 자격증 축은 이 enum 기준(정확 일치).
 * 매핑표: docs/ENUM_MAPPING.md §5
 *
 * <p>다른 공유 enum(JobType 등)과 달리 한글 라벨({@link #label()})을 백엔드가 보유한다 —
 * {@code certificate.certificate_name} 컬럼(표시용)을 등록 시점에 이 라벨로 채우기 때문.
 * {@link #OTHER} 는 사용자가 입력한 이름을 그대로 쓴다.
 */
public enum CertificateType {
    CAREGIVER("요양보호사"),
    NURSE_AIDE("간호조무사"),
    SOCIAL_WORKER_1("사회복지사 1급"),
    SOCIAL_WORKER_2("사회복지사 2급"),
    CARE_ASSISTANT("간병사"),
    DRIVER_LICENSE("운전면허"),
    OTHER("기타");

    private final String label;

    CertificateType(String label) {
        this.label = label;
    }

    /** 표시용 한글 라벨. OTHER 는 사용자 입력 이름을 우선한다. */
    public String label() {
        return label;
    }
}
