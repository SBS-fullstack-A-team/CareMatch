package com.carematch.jobposting.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 직종 enum 은 프론트·API·DB CHECK 제약(V3)과 값이 1:1 이어야 한다.
 * 값을 바꾸려면 docs/ENUM_MAPPING.md §1 + V*__ 마이그레이션도 함께.
 */
class JobTypeTest {

    @Test
    void 값_목록이_계약과_일치한다() {
        assertThat(JobType.values()).extracting(Enum::name).containsExactly(
                "CAREGIVER", "CARE_ATTENDANT", "NURSE_AIDE", "SOCIAL_WORKER",
                "LIFE_SUPPORT", "HOUSEKEEPER", "ETC");
    }

    @Test
    void 폐기된_NURSING_ASSISTANT_는_없다() {
        assertThat(JobType.values()).extracting(Enum::name).doesNotContain("NURSING_ASSISTANT");
    }
}
