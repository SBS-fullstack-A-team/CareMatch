package com.carematch.jobposting.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ExposureTypeTest {

    @Test
    void 우선순위는_SPECIAL이_가장_높고_NORMAL이_0() {
        assertThat(ExposureType.NORMAL.getPriority()).isZero();
        assertThat(ExposureType.PREMIUM.getPriority()).isGreaterThan(ExposureType.NORMAL.getPriority());
        assertThat(ExposureType.SPECIAL.getPriority()).isGreaterThan(ExposureType.PREMIUM.getPriority());
    }

    @Test
    void 비용은_그대로() {
        assertThat(ExposureType.NORMAL.getCost()).isZero();
        assertThat(ExposureType.PREMIUM.getCost()).isEqualTo(1_000);
        assertThat(ExposureType.SPECIAL.getCost()).isEqualTo(3_000);
    }
}
