package com.carematch.member.dto;

/**
 * 인재 ↔ 특정 구인공고 매칭 결과. 시설회원이 인재를 볼 때 자기 공고별 적합도.
 *
 * @param matchScore 0~100. 인재가 희망조건을 하나도 설정하지 않았으면 이 항목 자체가 목록에서 빠진다.
 */
public record PostingMatchResponse(
        Long jobPostingId,
        String title,
        String jobType,
        Integer matchScore
) {
}
