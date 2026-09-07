package com.carematch.jobposting.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.dto.JobPostingDtos.CreateRequest;
import com.carematch.jobposting.dto.JobPostingDtos.DetailResponse;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.jobposting.dto.JobPostingDtos.SummaryResponse;
import com.carematch.jobposting.dto.JobPostingDtos.UpdateRequest;
import com.carematch.jobposting.repository.JobPostingRepository;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.repository.FacilityProfileRepository;
import com.carematch.point.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 구인공고 등록/조회/수정/삭제.
 *
 * 접근 제어: SecurityFilterChain(ROLE_FACILITY) + FacilityApprovalInterceptor(승인 시설) 가
 * /api/job-postings/** 를 이미 통제한다. 서비스는 방어적으로 승인 여부를 한 번 더 확인한다.
 *
 * 미구현(TODO):
 *  - 다중조건 검색(다음 PR)
 *  - 매칭 스코어: JobSeekerProfile 에 희망지역/직종/급여 필드가 없어 계산 불가 → 항상 null
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

    private final JobPostingRepository jobPostingRepository;
    private final FacilityProfileRepository facilityProfileRepository;
    private final PointService pointService;

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
                .careGrade(req.careGrade())
                .elderGender(req.elderGender())
                .elderAgeRange(req.elderAgeRange())
                .mobilityStatus(req.mobilityStatus())
                .mealStatus(req.mealStatus())
                .cognitiveStatus(req.cognitiveStatus())
                .duties(req.duties())
                .requiredDocuments(req.requiredDocuments())
                .exposureType(exposureType)
                .build();

        if (exposureType != ExposureType.NORMAL) {
            posting.applyExposure(EXPOSURE_DAYS);
        }

        return DetailResponse.from(jobPostingRepository.save(posting), null);
    }

    public PageResponse<SummaryResponse> listOpen(Pageable pageable) {
        return PageResponse.of(
                jobPostingRepository.findByStatus(JobPostingStatus.OPEN, pageable),
                SummaryResponse::from);
    }

    @Transactional
    public DetailResponse getDetail(Long jobPostingId) {
        JobPosting posting = jobPostingRepository.findWithFacilityById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        posting.increaseViewCount();
        return DetailResponse.from(posting, null);
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
