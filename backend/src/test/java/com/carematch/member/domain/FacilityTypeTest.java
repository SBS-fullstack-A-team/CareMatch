package com.carematch.member.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 시설유형 enum 은 프론트·API·DB CHECK 제약(V5)과 값이 1:1 이어야 한다.
 * 값을 바꾸려면 docs/ENUM_MAPPING.md §4 + V*__ 마이그레이션도 함께.
 */
class FacilityTypeTest {

    @Test
    void 값_목록이_계약과_일치한다() {
        assertThat(FacilityType.values()).extracting(Enum::name).containsExactly(
                "VISITING_CARE", "NURSING_HOME", "DAY_NIGHT_CARE",
                "COMMUNITY_CARE", "NURSING_HOSPITAL", "ETC");
    }
}
