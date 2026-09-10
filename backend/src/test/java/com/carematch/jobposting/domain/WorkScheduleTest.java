package com.carematch.jobposting.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 근무 시간대 enum 은 프론트·API·DB CHECK 제약(V4)과 값이 1:1 이어야 한다.
 * 값을 바꾸려면 docs/ENUM_MAPPING.md §2 + V*__ 마이그레이션도 함께.
 */
class WorkScheduleTest {

    @Test
    void 값_목록이_계약과_일치한다() {
        assertThat(WorkSchedule.values()).extracting(Enum::name)
                .containsExactly("DAY", "MORNING", "AFTERNOON", "NIGHT", "SHIFT");
    }
}
