package com.carematch.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 구인공고 동적 검색 조건 — MyBatis 매퍼(JobPostingMapper)에 그대로 파라미터로 전달된다.
 * 지역/직종처럼 조건이 늘어날 수 있는 다중 필터 검색이라 JPA 대신 MyBatis로 처리 (팀 규칙).
 */
@Getter
@Builder
public class JobPostingSearchCondition {
    private String region;
    private String jobType;
    private int offset;
    private int limit;
}
