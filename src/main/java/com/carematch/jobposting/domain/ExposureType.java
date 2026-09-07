package com.carematch.jobposting.domain;

import lombok.Getter;

/** 노출 옵션. 등록 시 기본 비용에 cost 가 추가되고, NORMAL 이 아니면 7일간 상단 노출된다. */
@Getter
public enum ExposureType {
    NORMAL(0),
    PREMIUM(1_000),
    SPECIAL(3_000);

    private final int cost;

    ExposureType(int cost) {
        this.cost = cost;
    }
}
