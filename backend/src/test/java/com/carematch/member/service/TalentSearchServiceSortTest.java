package com.carematch.member.service;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;

class TalentSearchServiceSortTest {

    @Test
    void 기본은_최근_갱신순() {
        assertThat(TalentSearchService.resolveSort(null))
                .containsExactly(new Sort.Order(Sort.Direction.DESC, "updatedAt"));
        assertThat(TalentSearchService.resolveSort("LATEST"))
                .containsExactly(new Sort.Order(Sort.Direction.DESC, "updatedAt"));
    }

    @Test
    void 경력순은_careerYears_우선_nulls_last_updatedAt_2차() {
        assertThat(TalentSearchService.resolveSort("CAREER_DESC")).containsExactly(
                Sort.Order.desc("careerYears").nullsLast(),
                new Sort.Order(Sort.Direction.DESC, "updatedAt"));
        assertThat(TalentSearchService.resolveSort("CAREER_ASC")).containsExactly(
                Sort.Order.asc("careerYears").nullsLast(),
                new Sort.Order(Sort.Direction.DESC, "updatedAt"));
    }

    @Test
    void 알수없는_정렬값은_기본으로() {
        assertThat(TalentSearchService.resolveSort("BOGUS"))
                .containsExactly(new Sort.Order(Sort.Direction.DESC, "updatedAt"));
    }
}
