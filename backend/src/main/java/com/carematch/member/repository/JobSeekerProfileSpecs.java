package com.carematch.member.repository;

import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.TalentSearchDtos.SearchCondition;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 인재 검색 동적 조건 (Criteria). 추가 의존성 없이 Spring Data 범위.
 * 지역·직종·근무형태·급여는 구직자 희망조건 컬럼 기준.
 */
public final class JobSeekerProfileSpecs {

    private JobSeekerProfileSpecs() {
    }

    public static Specification<JobSeekerProfile> from(SearchCondition c) {
        return (root, query, cb) -> {
            // 목록 조회 시 member 를 함께 fetch (단일값 → 페이지네이션 안전, count 쿼리엔 미적용)
            Class<?> resultType = query.getResultType();
            if (resultType != Long.class && resultType != long.class) {
                root.fetch("member", JoinType.INNER);
            }

            List<Predicate> ps = new ArrayList<>();

            if (c.seekingOnly() == null || c.seekingOnly()) {
                ps.add(cb.equal(root.get("employmentStatus"), EmploymentStatus.SEEKING));
            }
            if (c.desiredJobType() != null) {
                ps.add(cb.equal(root.get("desiredJobType"), c.desiredJobType()));
            }
            if (c.desiredWorkType() != null) {
                ps.add(cb.equal(root.get("desiredWorkType"), c.desiredWorkType()));
            }
            if (StringUtils.hasText(c.sido())) {
                ps.add(cb.equal(root.get("desiredSido"), c.sido()));
            }
            if (StringUtils.hasText(c.sigungu())) {
                ps.add(cb.equal(root.get("desiredSigungu"), c.sigungu()));
            }
            if (c.payType() != null) {
                ps.add(cb.equal(root.get("desiredPayType"), c.payType()));
            }
            if (c.payMax() != null) {
                ps.add(cb.lessThanOrEqualTo(root.get("desiredMinPay"), c.payMax()));
            }
            if (c.updatedWithinDays() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.get("updatedAt"),
                        LocalDateTime.now().minusDays(c.updatedWithinDays())));
            }

            return cb.and(ps.toArray(Predicate[]::new));
        };
    }
}
