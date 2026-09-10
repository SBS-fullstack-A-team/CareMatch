package com.carematch.member.repository;

import com.carematch.certificate.domain.Certificate;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.TalentSearchDtos.CareerBucket;
import com.carematch.member.dto.TalentSearchDtos.SearchCondition;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.CollectionUtils;
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
            if (!CollectionUtils.isEmpty(c.desiredWorkSchedules())) {
                ps.add(root.get("desiredWorkSchedule").in(c.desiredWorkSchedules()));
            }
            if (!CollectionUtils.isEmpty(c.payTypes())) {
                ps.add(root.get("desiredPayType").in(c.payTypes()));
            }
            if (c.payMax() != null) {
                ps.add(cb.lessThanOrEqualTo(root.get("desiredMinPay"), c.payMax()));
            }
            if (c.gender() != null) {
                ps.add(cb.equal(root.get("gender"), c.gender()));
            }
            if (!CollectionUtils.isEmpty(c.careerBuckets())) {
                List<Predicate> ranges = new ArrayList<>();
                for (CareerBucket bucket : c.careerBuckets()) {
                    Predicate min = cb.greaterThanOrEqualTo(root.get("careerYears"), bucket.minInclusive());
                    ranges.add(bucket.maxExclusive() == null ? min
                            : cb.and(min, cb.lessThan(root.get("careerYears"), bucket.maxExclusive())));
                }
                ps.add(cb.or(ranges.toArray(Predicate[]::new)));
            }
            if (!CollectionUtils.isEmpty(c.certificateNames())) {
                Subquery<Long> sub = query.subquery(Long.class);
                Root<Certificate> cert = sub.from(Certificate.class);
                sub.select(cert.get("id")).where(
                        cb.equal(cert.get("jobSeekerProfile"), root),
                        cert.get("certificateName").in(c.certificateNames()));
                ps.add(cb.exists(sub));
            }
            if (c.updatedWithinDays() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.get("updatedAt"),
                        LocalDateTime.now().minusDays(c.updatedWithinDays())));
            }

            // 다중값(희망지역 / 가능 업무 / 희망 고용형태): 컬렉션 조인 + distinct
            boolean joined = false;
            if (StringUtils.hasText(c.sido()) || StringUtils.hasText(c.sigungu())) {
                // 희망지역 중 (sido[, sigungu]) 를 포함한 인재 (한 region element 안에서 둘 다 일치)
                var region = root.join("desiredRegions", JoinType.INNER);
                List<Predicate> rp = new ArrayList<>();
                if (StringUtils.hasText(c.sido())) {
                    rp.add(cb.equal(region.get("sido"), c.sido()));
                }
                if (StringUtils.hasText(c.sigungu())) {
                    rp.add(cb.equal(region.get("sigungu"), c.sigungu()));
                }
                ps.add(cb.and(rp.toArray(Predicate[]::new)));
                joined = true;
            }
            if (!CollectionUtils.isEmpty(c.availableTasks())) {
                ps.add(root.join("availableTasks", JoinType.INNER).in(c.availableTasks()));
                joined = true;
            }
            if (!CollectionUtils.isEmpty(c.desiredEmploymentTypes())) {
                ps.add(root.join("desiredEmploymentTypes", JoinType.INNER).in(c.desiredEmploymentTypes()));
                joined = true;
            }
            if (joined) {
                query.distinct(true);
            }

            return cb.and(ps.toArray(Predicate[]::new));
        };
    }
}
