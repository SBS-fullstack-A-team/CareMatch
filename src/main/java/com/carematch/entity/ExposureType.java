package com.carematch.entity;

import lombok.Getter;

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
