package com.carematch.member.dto;

import com.carematch.member.domain.DesiredRegion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 희망 근무지역 한 건 (요청·응답 공용). {@code sigungu} 가 null/빈 값이면 "그 시/도 전체".
 * 값은 프론트 `SIDO_OPTIONS`/`DISTRICT_OPTIONS` 문자열 그대로.
 */
public record RegionDto(
        @NotBlank @Size(max = 30) String sido,
        @Size(max = 30) String sigungu
) {
    public static RegionDto from(DesiredRegion r) {
        return new RegionDto(r.getSido(), r.getSigungu());
    }

    public DesiredRegion toDesiredRegion() {
        return new DesiredRegion(sido, sigungu);
    }
}
