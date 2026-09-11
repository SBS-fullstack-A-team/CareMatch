package com.carematch.jobposting.service;

import com.carematch.application.repository.ApplicationRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.dto.JobPostingDtos.CreateRequest;
import com.carematch.jobposting.dto.JobPostingDtos.DetailResponse;
import com.carematch.jobposting.dto.JobPostingDtos.MapResult;
import com.carematch.jobposting.dto.JobPostingDtos.NearbyResult;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.jobposting.dto.JobPostingDtos.SearchCondition;
import com.carematch.jobposting.dto.JobPostingDtos.SummaryResponse;
import com.carematch.jobposting.dto.JobPostingDtos.UpdateRequest;
import com.carematch.jobposting.repository.JobPostingRepository;
import com.carematch.jobposting.repository.JobPostingSpecs;
import com.carematch.jobposting.repository.ScrapRepository;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.repository.FacilityProfileRepository;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.point.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 구인공고 등록/조회/수정/삭제.
 *
 * 접근 제어: SecurityFilterChain(ROLE_FACILITY) + FacilityApprovalInterceptor(승인 시설) 가
 * /api/job-postings/** 를 이미 통제한다. 서비스는 방어적으로 승인 여부를 한 번 더 확인한다.
 *
 * 매칭 스코어: 로그인한 구직자가 희망조건을 설정한 경우 {@link MatchScoreCalculator} 로 계산해
 * 목록/상세/비슷한공고/featured 응답에 채운다. 그 외(비로그인·시설회원·희망조건 미설정)는 null.
 *
 * 미구현(TODO):
 *  - 담당자명/전체주소: docs/JOBPOSTING_FIELDS.md §1
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostingService {

    /** 등록 기본 비용. 노출옵션 추가비용(ExposureType.cost)이 더해진다. */
    private static final int BASE_POSTING_COST = 500;
    /** 프리미엄/스페셜 상단 노출 기간(일). */
    private static final int EXPOSURE_DAYS = 7;
    /** 페이지 크기 상한. */
    private static final int MAX_PAGE_SIZE = 100;

    private final JobPostingRepository jobPostingRepository;
    private final FacilityProfileRepository facilityProfileRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final ScrapRepository scrapRepository;
    private final ApplicationRepository applicationRepository;
    private final PointService pointService;
    private final MatchScoreCalculator matchScoreCalculator;

    @Transactional
    public DetailResponse create(Long memberId, CreateRequest req) {
        FacilityProfile facility = facilityProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FACILITY_NOT_APPROVED, "no facility profile"));
        if (!facility.isApproved()) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_APPROVED,
                    "approvalStatus=" + facility.getApprovalStatus());
        }

        ExposureType exposureType = req.exposureType() == null ? ExposureType.NORMAL : req.exposureType();
        int cost = BASE_POSTING_COST + exposureType.getCost();
        if (!pointService.deduct(memberId, cost, "JOB_POSTING_CREATE:" + exposureType.name())) {
            throw new BusinessException(ErrorCode.JOB_POSTING_POINT_SHORTAGE, "cost=" + cost);
        }

        JobPosting posting = JobPosting.builder()
                .facilityProfile(facility)
                .title(req.title())
                .jobType(req.jobType())
                .description(req.description())
                .thumbnailUrl(req.thumbnailUrl())
                .catchphrase(req.catchphrase())
                .workType(req.workType())
                .workSchedule(req.workSchedule())
                .employmentType(req.employmentType())
                .employmentTypeNote(req.employmentTypeNote())
                .workDays(req.workDays())
                .workStartTime(req.workStartTime())
                .workEndTime(req.workEndTime())
                .payType(req.payType())
                .payAmount(req.payAmount())
                .recruitCount(req.recruitCount())
                .deadline(req.deadline())
                .sido(req.sido())
                .sigungu(req.sigungu())
                .addressDetail(req.addressDetail())
                .latitude(req.latitude())
                .longitude(req.longitude())
                .careGrade(req.careGrade())
                .elderGender(req.elderGender())
                .elderAgeRange(req.elderAgeRange())
                .mobilityStatus(req.mobilityStatus())
                .mealStatus(req.mealStatus())
                .cognitiveStatus(req.cognitiveStatus())
                .elderNote(req.elderNote())
                .duties(req.duties())
                .requiredDocuments(req.requiredDocuments())
                .requirements(req.requirements())
                .preferences(req.preferences())
                .benefits(req.benefits())
                .minCareerYears(req.minCareerYears())
                .exposureType(exposureType)
                .build();

        if (exposureType != ExposureType.NORMAL) {
            posting.applyExposure(EXPOSURE_DAYS);
        }

        return DetailResponse.from(jobPostingRepository.save(posting), null);
    }

    /**
     * 다중조건 검색 (상태 OPEN 고정). 로그인 회원이면 각 결과에 찜 여부(scrapped)·매칭점수를 채운다.
     *
     * <p><b>RECOMMENDED + 로그인 구직자</b>: SQL 은 노출등급→최신 순으로 뽑고, 그 페이지 안에서
     * <i>같은 노출등급끼리만</i> 매칭점수 우선으로 재정렬한다. 유료 상단노출(노출등급)은 매칭점수로
     * 뒤집히지 않는다. 매칭점수는 조회 시점 Java 계산이라 같은 등급 내 순서는 페이지 경계에서
     * 근사치다 (부채 C2).
     */
    public PageResponse<SummaryResponse> search(SearchCondition cond, int page, int size, Long viewerMemberId) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String sortKey = sortKey(cond.sort());
        PageRequest pageable = PageRequest.of(Math.max(page, 0), safeSize, resolveSort(sortKey));
        Page<JobPosting> pageResult = jobPostingRepository.findAll(JobPostingSpecs.from(cond), pageable);

        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        Set<Long> scrappedIds = scrappedIdsAmong(viewerMemberId, pageResult.getContent());
        Map<Long, Long> applicantCounts = applicantCountsAmong(pageResult.getContent());

        Map<Long, Integer> scores = new HashMap<>();
        pageResult.getContent().forEach(jp -> scores.put(jp.getId(), matchScore(viewer, jp)));

        List<JobPosting> content = pageResult.getContent();
        if ("RECOMMENDED".equals(sortKey) && viewer != null) {
            content = content.stream()
                    .sorted(byExposureThenMatch(jp -> {
                        Integer s = scores.get(jp.getId());
                        return s == null ? Integer.MIN_VALUE : s;
                    }))
                    .toList();
        }

        List<SummaryResponse> mapped = content.stream()
                .map(jp -> SummaryResponse.from(jp,
                        scrappedFlag(viewerMemberId, scrappedIds, jp.getId()), scores.get(jp.getId()),
                        applicantCount(applicantCounts, jp.getId())))
                .toList();
        return new PageResponse<>(mapped, pageResult.getNumber(), pageResult.getSize(),
                pageResult.getTotalElements(), pageResult.getTotalPages());
    }

    /**
     * 노출등급 desc → 매칭점수 desc(미채점은 뒤) → 최신 desc.
     * 노출등급이 1순위이므로 유료 상단노출 공고가 매칭점수 때문에 일반 공고 아래로 내려가지 않는다.
     */
    static Comparator<JobPosting> byExposureThenMatch(java.util.function.ToIntFunction<JobPosting> scoreOf) {
        return Comparator.comparingInt(JobPosting::getExposurePriority).reversed()
                .thenComparing(Comparator.comparingInt(scoreOf).reversed())
                .thenComparing(JobPosting::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    /** 로그인 회원이 구직자면 그 프로필, 아니면(비로그인·시설회원) null. 매칭 스코어 계산에만 사용. */
    private JobSeekerProfile viewerProfile(Long viewerMemberId) {
        return viewerMemberId == null ? null
                : jobSeekerProfileRepository.findByMemberId(viewerMemberId).orElse(null);
    }

    private Integer matchScore(JobSeekerProfile viewer, JobPosting posting) {
        return viewer == null ? null : matchScoreCalculator.score(viewer, posting);
    }

    /** 여러 공고 중 이 회원이 찜한 id 집합. 비로그인/빈 목록이면 빈 집합. */
    private Set<Long> scrappedIdsAmong(Long viewerMemberId, List<JobPosting> postings) {
        if (viewerMemberId == null || postings.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(scrapRepository.findScrappedPostingIds(
                viewerMemberId, postings.stream().map(JobPosting::getId).toList()));
    }

    /** 비로그인이면 null, 로그인이면 찜 여부. */
    private Boolean scrappedFlag(Long viewerMemberId, Set<Long> scrappedIds, Long postingId) {
        return viewerMemberId == null ? null : scrappedIds.contains(postingId);
    }

    /** 여러 공고의 지원자 수(취소 제외). 지원자 없는 공고는 map 에 없다 → 0 취급. */
    private Map<Long, Long> applicantCountsAmong(List<JobPosting> postings) {
        if (postings.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> counts = new HashMap<>();
        applicationRepository.countByJobPostingIdIn(postings.stream().map(JobPosting::getId).toList())
                .forEach(r -> counts.put(r.getPostingId(), r.getCount()));
        return counts;
    }

    private static long applicantCount(Map<Long, Long> counts, Long postingId) {
        return counts.getOrDefault(postingId, 0L);
    }

    /** 단건 지원자 수(취소 제외). */
    private long applicantCountOf(Long postingId) {
        return applicationRepository.countByJobPostingIdIn(List.of(postingId)).stream()
                .findFirst().map(ApplicationRepository.PostingApplicantCount::getCount).orElse(0L);
    }

    /** "소페셜 채용정보" 상단 노출 — 만료 안 된 SPECIAL 공고 상위 3. */
    public List<SummaryResponse> featured(Long viewerMemberId) {
        List<JobPosting> postings = jobPostingRepository
                .findTop3ByStatusAndExposureTypeAndExposureExpiredAtAfterOrderByCreatedAtDesc(
                        JobPostingStatus.OPEN, ExposureType.SPECIAL, LocalDateTime.now());
        Set<Long> scrappedIds = scrappedIdsAmong(viewerMemberId, postings);
        Map<Long, Long> applicantCounts = applicantCountsAmong(postings);
        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        return postings.stream()
                .map(jp -> SummaryResponse.from(jp, scrappedFlag(viewerMemberId, scrappedIds, jp.getId()),
                        matchScore(viewer, jp), applicantCount(applicantCounts, jp.getId())))
                .toList();
    }

    /**
     * 정렬 규칙. RECOMMENDED 는 노출등급(exposurePriority) → 최신 순.
     * exposurePriority 는 등록 시 exposureType.priority 를 비정규화한 int 컬럼이고,
     * 노출 만료 시 스케줄러({@link JobPostingExposureScheduler})가 NORMAL(0) 로 강등한다.
     */
    private static String sortKey(String sort) {
        return sort == null ? "RECOMMENDED" : sort.toUpperCase();
    }

    static Sort resolveSort(String sortKey) {
        return switch (sortKey) {
            case "LATEST" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "DEADLINE" -> Sort.by(Sort.Direction.ASC, "deadline");
            case "PAY_DESC" -> Sort.by(Sort.Direction.DESC, "payAmount");
            case "PAY_ASC" -> Sort.by(Sort.Direction.ASC, "payAmount");
            case "VIEWS" -> Sort.by(Sort.Direction.DESC, "viewCount");
            default -> Sort.by(Sort.Order.desc("exposurePriority"), Sort.Order.desc("createdAt"));
        };
    }

    /** 비슷한 공고 — 같은 시군구 + 직종, 자기 제외, OPEN 상위 6. */
    public List<SummaryResponse> similar(Long jobPostingId, Long viewerMemberId) {
        JobPosting base = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        List<JobPosting> list = jobPostingRepository
                .findTop6ByStatusAndSigunguAndJobTypeAndIdNotOrderByExposurePriorityDescCreatedAtDesc(
                        JobPostingStatus.OPEN, base.getSigungu(), base.getJobType(), jobPostingId);
        Set<Long> scrappedIds = scrappedIdsAmong(viewerMemberId, list);
        Map<Long, Long> applicantCounts = applicantCountsAmong(list);
        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        return list.stream()
                .map(jp -> SummaryResponse.from(jp, scrappedFlag(viewerMemberId, scrappedIds, jp.getId()),
                        matchScore(viewer, jp), applicantCount(applicantCounts, jp.getId())))
                .toList();
    }

    /** 지구 반경(km). */
    private static final double EARTH_RADIUS_KM = 6371.0;
    /** 반경 검색 상한(km). */
    private static final double MAX_RADIUS_KM = 50.0;
    /** 반경 검색 결과 상한. */
    private static final int MAX_NEARBY_LIMIT = 100;
    /** 바운딩 박스 1차 후보 상한 — 밀집 지역 + 넓은 반경에서 메모리 폭주 방지. */
    private static final int NEARBY_CANDIDATE_CAP = 500;
    /** 지도 뷰포트 결과 상한 — 넓게 축소했을 때 마커 폭주 방지. 넘치면 최신순으로 잘린다. */
    private static final int MAX_MAP_RESULTS = 200;

    /**
     * "내 주변 일자리" — 기준 좌표 반경 내 OPEN 공고를 가까운 순으로.
     * DB 는 위경도 바운딩 박스로 1차 필터하고, 정밀 거리 계산·정렬은 여기서 Haversine 으로 한다
     * (DB 벤더 미확정이라 공간 함수 미사용).
     */
    public List<NearbyResult> nearby(double lat, double lng, double radiusKm, int limit, Long viewerMemberId) {
        double safeRadius = Math.min(Math.max(radiusKm, 0.1), MAX_RADIUS_KM);
        int safeLimit = Math.min(Math.max(limit, 1), MAX_NEARBY_LIMIT);

        double latDelta = safeRadius / 111.0;
        double lngDelta = safeRadius / (111.0 * Math.max(Math.cos(Math.toRadians(lat)), 0.01));
        List<JobPosting> candidates = jobPostingRepository.findOpenWithinBoundingBox(
                lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta,
                PageRequest.of(0, NEARBY_CANDIDATE_CAP));

        record Scored(JobPosting posting, double km) {
        }
        List<Scored> within = candidates.stream()
                .map(jp -> new Scored(jp, distanceKm(lat, lng, jp.getLatitude(), jp.getLongitude())))
                .filter(s -> s.km() <= safeRadius)
                .sorted(Comparator.comparingDouble(Scored::km))
                .limit(safeLimit)
                .toList();

        List<JobPosting> postings = within.stream().map(Scored::posting).toList();
        Set<Long> scrappedIds = scrappedIdsAmong(viewerMemberId, postings);
        Map<Long, Long> applicantCounts = applicantCountsAmong(postings);
        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        return within.stream()
                .map(s -> new NearbyResult(
                        SummaryResponse.from(s.posting(),
                                scrappedFlag(viewerMemberId, scrappedIds, s.posting().getId()),
                                matchScore(viewer, s.posting()),
                                applicantCount(applicantCounts, s.posting().getId())),
                        Math.round(s.km() * 10.0) / 10.0))
                .toList();
    }

    /**
     * "지도로 보기" — 지도 뷰포트(남서·북동 모서리) 안의 OPEN 공고를 마커용으로.
     * nearby 와 달리 원형 반경이 아니라 사각형 영역이며, 거리 계산·정렬이 없어 더 가볍다.
     * 모서리 좌표는 순서가 뒤바뀌어 와도(min/max) 보정한다. 결과가 {@link #MAX_MAP_RESULTS} 를
     * 넘으면 최신순으로 잘리므로, 프론트는 "확대해서 보세요" 안내를 띄우면 된다.
     */
    public List<MapResult> mapView(double swLat, double swLng, double neLat, double neLng, Long viewerMemberId) {
        double minLat = Math.min(swLat, neLat);
        double maxLat = Math.max(swLat, neLat);
        double minLng = Math.min(swLng, neLng);
        double maxLng = Math.max(swLng, neLng);

        List<JobPosting> postings = jobPostingRepository.findOpenWithinBoundingBox(
                minLat, maxLat, minLng, maxLng, PageRequest.of(0, MAX_MAP_RESULTS));

        Set<Long> scrappedIds = scrappedIdsAmong(viewerMemberId, postings);
        Map<Long, Long> applicantCounts = applicantCountsAmong(postings);
        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        return postings.stream()
                .map(jp -> new MapResult(
                        SummaryResponse.from(jp,
                                scrappedFlag(viewerMemberId, scrappedIds, jp.getId()),
                                matchScore(viewer, jp),
                                applicantCount(applicantCounts, jp.getId())),
                        jp.getLatitude(), jp.getLongitude()))
                .toList();
    }

    /** 두 좌표 간 대원 거리(km). Haversine. */
    static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @Transactional
    public DetailResponse getDetail(Long jobPostingId, Long viewerMemberId) {
        JobPosting posting = jobPostingRepository.findWithFacilityById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        posting.increaseViewCount();

        Boolean scrapped = viewerMemberId == null ? null
                : scrapRepository.existsByMemberIdAndJobPostingId(viewerMemberId, jobPostingId);
        MatchScoreCalculator.MatchResult match = matchScoreCalculator.evaluate(viewerProfile(viewerMemberId), posting);
        return DetailResponse.from(posting, match.score(), match.reasons(), scrapped,
                applicantCountOf(jobPostingId));
    }

    /** 공고 마감. 작성 시설 본인만. 이미 마감된 공고면 409. */
    @Transactional
    public DetailResponse close(Long memberId, Long jobPostingId) {
        JobPosting posting = findOwned(memberId, jobPostingId);
        if (posting.getStatus() == JobPostingStatus.CLOSED) {
            throw new BusinessException(ErrorCode.JOB_POSTING_ALREADY_CLOSED, "id=" + jobPostingId);
        }
        posting.close();
        return DetailResponse.from(posting, null, null, null, applicantCountOf(jobPostingId));
    }

    @Transactional
    public DetailResponse update(Long memberId, Long jobPostingId, UpdateRequest req) {
        JobPosting posting = findOwned(memberId, jobPostingId);
        posting.update(req.toUpdateForm());
        return DetailResponse.from(posting, null, null, null, applicantCountOf(jobPostingId));
    }

    @Transactional
    public void delete(Long memberId, Long jobPostingId) {
        JobPosting posting = findOwned(memberId, jobPostingId);
        jobPostingRepository.delete(posting);
    }

    private JobPosting findOwned(Long memberId, Long jobPostingId) {
        JobPosting posting = jobPostingRepository.findWithFacilityById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        if (!posting.isOwnedBy(memberId)) {
            throw new BusinessException(ErrorCode.JOB_POSTING_ACCESS_DENIED, "memberId=" + memberId);
        }
        return posting;
    }
}
