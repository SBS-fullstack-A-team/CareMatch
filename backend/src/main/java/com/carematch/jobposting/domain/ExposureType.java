package com.carematch.jobposting.domain;

import lombok.Getter;

/**
 * 노출 옵션. 등록 시 기본 비용에 cost 가 추가되고, NORMAL 이 아니면 7일간 상단 노출된다.
 *
 * {@code priority} 는 RECOMMENDED 정렬 우선순위(클수록 위). 과거엔 enum 이름 문자열 DESC 에
 * 의존했으나(SPECIAL &gt; PREMIUM &gt; NORMAL 이 우연히 성립), 값이 늘면 깨지므로 명시적 int 로 둔다.
 * 엔티티는 이 값을 {@code job_posting.exposure_priority} 컬럼에 비정규화해 저장한다.
 */
@Getter
public enum ExposureType {
    NORMAL(0, 0),
    PREMIUM(1_000, 1),
    SPECIAL(3_000, 2);

    private final int cost;
    private final int priority;

    ExposureType(int cost, int priority) {
        this.cost = cost;
        this.priority = priority;
    }
}
