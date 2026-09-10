package com.carematch.member.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

/**
 * 구직자 희망 근무지역 한 건. {@link JobSeekerProfile#getDesiredRegions()} 의 element.
 *
 * <p>{@code sigungu} 가 null 이면 "그 시/도 전체"를 뜻한다. sido 는 필수.
 * 매칭·검색은 sido/sigungu 문자열 동등 비교(프론트 `SIDO_OPTIONS`/`DISTRICT_OPTIONS` 값 기준).
 */
@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DesiredRegion {

    @Column(name = "sido", length = 30, nullable = false)
    private String sido;

    @Column(name = "sigungu", length = 30)
    private String sigungu;

    public DesiredRegion(String sido, String sigungu) {
        this.sido = Objects.requireNonNull(sido, "desiredRegion.sido");
        this.sigungu = (sigungu == null || sigungu.isBlank()) ? null : sigungu;
    }

    public boolean hasSigungu() {
        return sigungu != null;
    }
}
