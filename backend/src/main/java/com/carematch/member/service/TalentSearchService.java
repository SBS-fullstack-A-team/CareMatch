package com.carematch.member.service;

import com.carematch.certificate.domain.Certificate;
import com.carematch.certificate.repository.CertificateRepository;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.TalentSearchDtos.CareerBucket;
import com.carematch.member.dto.TalentSearchDtos.FacetsResponse;
import com.carematch.member.dto.TalentSearchDtos.SearchCondition;
import com.carematch.member.dto.TalentSearchDtos.TalentSummary;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.member.repository.JobSeekerProfileSpecs;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 인재정보 검색. 승인된 시설회원 / 관리자만.
 *
 * 정렬: LATEST(기본, updatedAt desc) / CAREER_DESC / CAREER_ASC. 경력 정렬 시 careerYears 가
 * null 인 프로필은 뒤로 보내고 updatedAt desc 를 2차 기준으로 쓴다.
 * 매칭 점수 정렬(추천순)은 조회 시점 Java 계산이라 SQL 정렬이 불가 — 후속 과제
 * (구인공고 RECOMMENDED 와 동일 제약).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TalentSearchService {

    private static final int MAX_PAGE_SIZE = 100;

    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final CertificateRepository certificateRepository;
    private final TalentMatcher talentMatcher;
    private final EntityManager entityManager;

    public PageResponse<TalentSummary> search(SearchCondition cond, int page, int size,
                                              Long viewerMemberId, boolean viewerIsFacility) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), safeSize, resolveSort(cond.sort()));

        Page<JobSeekerProfile> result =
                jobSeekerProfileRepository.findAll(JobSeekerProfileSpecs.from(cond), pageable);

        Map<Long, List<String>> certNames = certificateNames(result.getContent());
        Map<Long, List<String>> certTypes = certificateTypes(result.getContent());
        List<JobPosting> myPostings = viewerIsFacility
                ? talentMatcher.openPostingsOf(viewerMemberId)
                : List.of();

        return PageResponse.of(result, p -> TalentSummary.from(
                p,
                certNames.getOrDefault(p.getId(), List.of()),
                certTypes.getOrDefault(p.getId(), List.of()),
                talentMatcher.bestScore(p, myPostings)));
    }

    /**
     * 좌측 필터 옵션별 결과 인원수. 축마다 자기 자신의 선택은 제외한 조건으로
     * {@code GROUP BY} 집계 쿼리 1회 (JobPostingService#facets 와 동일 패턴).
     */
    public FacetsResponse facets(SearchCondition cond) {
        return new FacetsResponse(
                countGroupedBy(cond.withoutSidos(), "sido", true, null),
                countGroupedBy(cond.withoutDesiredJobTypes(), "desiredJobType", false, null),
                countGroupedBy(cond.withoutDesiredWorkSchedules(), "desiredWorkSchedule", false, null),
                countGroupedBy(cond.withoutCareerBuckets(), "careerYears", false, CareerBucket.class));
    }

    /**
     * {@code SELECT <attribute>, COUNT(*) FROM JobSeekerProfile WHERE <cond 의 조건> GROUP BY <attribute>}.
     * {@link JobSeekerProfileSpecs#from} 을 재사용해 검색/집계가 항상 같은 조건 로직을 쓰게 한다.
     *
     * @param onDesiredRegions true 면 {@code desiredRegions} 조인에서 attribute 를 읽는다 (sido 전용)
     * @param bucketEnum       null 아니면 attribute(careerYears) 를 이 enum 의 min/maxExclusive 구간으로
     *                         묶어서 센다 (careerBucket 전용). null 이면 값 그대로 그룹핑.
     */
    private <E extends Enum<E>> Map<String, Long> countGroupedBy(
            SearchCondition cond, String attribute, boolean onDesiredRegions, Class<E> bucketEnum) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Tuple> query = cb.createTupleQuery();
        Root<JobSeekerProfile> root = query.from(JobSeekerProfile.class);

        Predicate predicate = JobSeekerProfileSpecs.from(cond).toPredicate(root, query, cb);

        jakarta.persistence.criteria.Expression<?> axis;
        if (onDesiredRegions) {
            axis = root.join("desiredRegions", JoinType.INNER).get(attribute);
        } else if (bucketEnum != null) {
            CriteriaBuilder.Case<String> caseExpr = cb.selectCase();
            for (E constant : bucketEnum.getEnumConstants()) {
                CareerBucket bucket = (CareerBucket) (Object) constant;
                Predicate min = cb.greaterThanOrEqualTo(root.get(attribute), bucket.minInclusive());
                Predicate range = bucket.maxExclusive() == null ? min
                        : cb.and(min, cb.lessThan(root.get(attribute), bucket.maxExclusive()));
                caseExpr = caseExpr.when(range, constant.name());
            }
            axis = caseExpr.otherwise(cb.nullLiteral(String.class));
        } else {
            axis = root.get(attribute);
        }

        // countDistinct(root): desiredRegions 조인은 인재 1명이 여러 행으로 늘어날 수 있어
        // (희망지역 최대 3개) 프로필 기준 인원수로 셀 때는 distinct 가 필요하다.
        query.multiselect(axis, cb.countDistinct(root)).where(predicate).groupBy(axis);

        Map<String, Long> counts = new LinkedHashMap<>();
        for (Tuple row : entityManager.createQuery(query).getResultList()) {
            Object key = row.get(0);
            if (key != null) {
                counts.merge(key.toString(), (Long) row.get(1), Long::sum);
            }
        }
        return counts;
    }

    static Sort resolveSort(String sort) {
        String key = sort == null ? "LATEST" : sort.toUpperCase();
        return switch (key) {
            case "CAREER_DESC" -> Sort.by(
                    Sort.Order.desc("careerYears").nullsLast(), Sort.Order.desc("updatedAt"));
            case "CAREER_ASC" -> Sort.by(
                    Sort.Order.asc("careerYears").nullsLast(), Sort.Order.desc("updatedAt"));
            default -> Sort.by(Sort.Direction.DESC, "updatedAt");
        };
    }

    private Map<Long, List<String>> certificateNames(List<JobSeekerProfile> profiles) {
        if (profiles.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = profiles.stream().map(JobSeekerProfile::getId).toList();
        return certificateRepository.findByJobSeekerProfileIdIn(ids).stream()
                .collect(Collectors.groupingBy(
                        c -> c.getJobSeekerProfile().getId(),
                        Collectors.mapping(Certificate::getCertificateName, Collectors.toList())));
    }

    private Map<Long, List<String>> certificateTypes(List<JobSeekerProfile> profiles) {
        if (profiles.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = profiles.stream().map(JobSeekerProfile::getId).toList();
        return certificateRepository.findByJobSeekerProfileIdIn(ids).stream()
                .collect(Collectors.groupingBy(
                        c -> c.getJobSeekerProfile().getId(),
                        Collectors.mapping(c -> c.getCertificateType().name(), Collectors.toList())));
    }
}
