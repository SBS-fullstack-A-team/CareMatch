package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.dto.JobPostingDtos.SearchCondition;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 구인공고 다중조건 검색 Specification.
 * 모든 조건은 값이 있을 때만 AND 로 추가되고, 상태는 항상 OPEN 으로 고정된다.
 */
public final class JobPostingSpecs {

    private JobPostingSpecs() {
    }

    public static Specification<JobPosting> from(SearchCondition c) {
        return (root, query, cb) -> {
            // 목록 조회(엔티티 자체를 select) 시에만 시설/회원을 fetch 한다.
            // count()/facets() 는 CriteriaQuery<Long> · CriteriaQuery<Tuple> 이라 fetch 가 허용되지 않는다.
            Class<?> resultType = query.getResultType();
            if (resultType == JobPosting.class) {
                root.fetch("facilityProfile", JoinType.INNER).fetch("member", JoinType.INNER);
            }

            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("status"), JobPostingStatus.OPEN));

            addIn(ps, root.get("sido"), c.sidos());
            if (hasText(c.sigungu())) {
                ps.add(cb.equal(root.get("sigungu"), c.sigungu()));
            }
            addIn(ps, root.get("jobType"), c.jobTypes());

            // facilityType 필터와 keyword(시설명 포함) 검색이 같은 join 을 공유해 중복 join 을 피한다.
            boolean needsFacilityJoin = (c.facilityTypes() != null && !c.facilityTypes().isEmpty())
                    || hasText(c.keyword());
            Join<Object, Object> facilityJoin = needsFacilityJoin
                    ? root.join("facilityProfile", JoinType.INNER)
                    : null;
            if (c.facilityTypes() != null && !c.facilityTypes().isEmpty()) {
                ps.add(facilityJoin.get("facilityType").in(c.facilityTypes()));
            }

            addIn(ps, root.get("workType"), c.workTypes());
            addIn(ps, root.get("workSchedule"), c.workSchedules());
            addIn(ps, root.get("employmentType"), c.employmentTypes());
            addIn(ps, root.get("careGrade"), c.careGrades());
            addIn(ps, root.get("mobilityStatus"), c.mobilityStatuses());
            addIn(ps, root.get("payType"), c.payTypes());

            if (c.payMin() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.get("payAmount"), c.payMin()));
            }
            if (c.payMax() != null) {
                ps.add(cb.lessThanOrEqualTo(root.get("payAmount"), c.payMax()));
            }

            if (hasText(c.keyword())) {
                String like = "%" + c.keyword().trim().toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(facilityJoin.get("facilityName")), like)));
            }

            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    private static void addIn(List<Predicate> ps, jakarta.persistence.criteria.Path<?> path, Collection<?> values) {
        if (values != null && !values.isEmpty()) {
            ps.add(path.in(values));
        }
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
