package com.carematch.jobposting.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class DistanceTest {

    @Test
    void 같은_좌표는_0() {
        assertThat(JobPostingService.distanceKm(37.5665, 126.9780, 37.5665, 126.9780)).isZero();
    }

    @Test
    void 위도_1도는_약_111km() {
        assertThat(JobPostingService.distanceKm(0, 0, 1, 0)).isCloseTo(111.19, within(1.0));
    }

    @Test
    void 적도에서_경도_1도는_약_111km() {
        assertThat(JobPostingService.distanceKm(0, 0, 0, 1)).isCloseTo(111.32, within(1.0));
    }

    @Test
    void 서울시청_강남역_약_9km() {
        // 서울시청(37.5665, 126.9780) ↔ 강남역(37.4979, 127.0276)
        assertThat(JobPostingService.distanceKm(37.5665, 126.9780, 37.4979, 127.0276))
                .isBetween(8.0, 10.0);
    }
}
