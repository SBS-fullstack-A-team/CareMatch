package com.carematch.jobposting.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.dto.JobPostingDtos.CreateRequest;
import com.carematch.jobposting.dto.JobPostingDtos.DetailResponse;
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
import java.util.List;
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
 *  - 시설유형/담당자/주소: FacilityProfile 확장 후 응답에 포함
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
                .workType(req.workType())
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
                .exposureType(exposureType)
                .build();

        if (exposureType != ExposureType.NORMAL) {
            posting.applyExposure(EXPOSURE_DAYS);
        }

        return DetailResponse.from(jobPostingRepository.save(posting), null);
    }

    /** 다중조건 검색 (상태 OPEN 고정). 로그인 회원이면 각 결과에 찜 여부(scrapped)를 채운다. */
    public PageResponse<SummaryResponse> search(SearchCondition cond, int page, int size, Long viewerMemberId) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), safeSize, resolveSort(cond.sort()));
        Page<JobPosting> pageResult = jobPostingRepository.findAll(JobPostingSpecs.from(cond), pageable);

        Set<Long> scrappedIds = scrappedIdsAmong(viewerMemberId, pageResult.getContent());
        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        return PageResponse.of(pageResult,
                jp -> SummaryResponse.from(jp, scrappedFlag(viewerMemberId, scrappedIds, jp.getId()),
                        matchScore(viewer, jp)));
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

    /** "소페셜 채용정보" 상단 노출 — 만료 안 된 SPECIAL 공고 상위 3. */
    public List<SummaryResponse> featured(Long viewerMemberId) {
        List<JobPosting> postings = jobPostingRepository
                .findTop3ByStatusAndExposureTypeAndExposureExpiredAtAfterOrderByCreatedAtDesc(
                        JobPostingStatus.OPEN, ExposureType.SPECIAL, LocalDateTime.now());
        Set<Long> scrappedIds = scrappedIdsAmong(viewerMemberId, postings);
        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        return postings.stream()
                .map(jp -> SummaryResponse.from(jp, scrappedFlag(viewerMemberId, scrappedIds, jp.getId()),
                        matchScore(viewer, jp)))
                .toList();
    }

    /**
     * 정렬 규칙. RECOMMENDED 는 노출등급(exposurePriority) → 최신 순.
     * exposurePriority 는 등록 시 exposureType.priority 를 비정규화한 int 컬럼이고,
     * 노출 만료 시 스케줄러({@link JobPostingExposureScheduler})가 NORMAL(0) 로 강등한다.
     */
    private Sort resolveSort(String sort) {
        String key = sort == null ? "RECOMMENDED" : sort.toUpperCase();
        return switch (key) {
            case "LATEST" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "DEADLINE" -> Sort.by(Sort.Direction.ASC, "deadline");
            case "PAY_DESC" -> Sort.by(Sort.Direction.DESC, "payAmount");
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
        JobSeekerProfile viewer = viewerProfile(viewerMemberId);
        return list.stream()
                .map(jp -> SummaryResponse.from(jp, scrappedFlag(viewerMemberId, scrappedIds, jp.getId()),
                        matchScore(viewer, jp)))
                .toList();
    }

    @Transactional
    public DetailResponse getDetail(Long jobPostingId, Long viewerMemberId) {
        JobPosting posting = jobPostingRepository.findWithFacilityById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        posting.increaseViewCount();

        Boolean scrapped = viewerMemberId == null ? null
                : scrapRepository.existsByMemberIdAndJobPostingId(viewerMemberId, jobPostingId);
        Integer matchingScore = matchScore(viewerProfile(viewerMemberId), posting);
        return DetailResponse.from(posting, matchingScore, scrapped);
    }

    @Transactional
    public DetailResponse update(Long memberId, Long jobPostingId, UpdateRequest req) {
        JobPosting posting = findOwned(memberId, jobPostingId);
        posting.update(req.toUpdateForm());
        return DetailResponse.from(posting, null);
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
