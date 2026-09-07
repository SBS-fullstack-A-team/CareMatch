package com.carematch.service;

import com.carematch.dto.JobPostingCreateRequest;
import com.carematch.dto.JobPostingResponse;
import com.carematch.dto.JobPostingSearchCondition;
import com.carematch.dto.JobPostingUpdateRequest;
import com.carematch.entity.ExposureType;
import com.carematch.entity.JobPosting;
import com.carematch.entity.JobSeeker;
import com.carematch.entity.Member;
import com.carematch.entity.MemberStatus;
import com.carematch.entity.Role;
import com.carematch.global.exception.CustomException;
import com.carematch.global.exception.ErrorCode;
import com.carematch.mapper.JobPostingMapper;
import com.carematch.repository.JobPostingRepository;
import com.carematch.repository.JobSeekerRepository;
import com.carematch.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostingService {

    // 구인공고 등록 기본 비용. 노출 옵션(ExposureType) 추가 비용은 별도로 더해진다.
    private static final int BASE_POSTING_COST = 500;
    // 프리미엄/스페셜 노출 기간(일).
    private static final int EXPOSURE_DAYS = 7;

    private final JobPostingRepository jobPostingRepository;
    private final JobPostingMapper jobPostingMapper;
    private final MemberRepository memberRepository;
    private final JobSeekerRepository jobSeekerRepository;
    private final PointService pointService;

    @Transactional
    public JobPostingResponse create(Long memberId, JobPostingCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        if (member.getRole() != Role.EMPLOYER) {
            throw new CustomException(ErrorCode.EMPLOYER_ONLY);
        }
        if (member.getStatus() != MemberStatus.APPROVED) {
            throw new CustomException(ErrorCode.EMPLOYER_NOT_APPROVED);
        }
        if (!member.hasFacilityProfile()) {
            throw new CustomException(ErrorCode.FACILITY_PROFILE_REQUIRED);
        }

        ExposureType exposureType = request.exposureType() == null
                ? ExposureType.NORMAL
                : request.exposureType();

        int cost = BASE_POSTING_COST + exposureType.getCost();
        pointService.use(memberId, cost, "구인공고 등록 (" + exposureType.name() + ")");

        JobPosting jobPosting = JobPosting.builder()
                .member(member)
                .title(request.title())
                .jobType(request.jobType())
                .description(request.description())
                .workType(request.workType())
                .employmentType(request.employmentType())
                .employmentTypeNote(request.employmentTypeNote())
                .workDays(request.workDays())
                .workStartTime(request.workStartTime())
                .workEndTime(request.workEndTime())
                .payType(request.payType())
                .payAmount(request.payAmount())
                .recruitCount(request.recruitCount())
                .deadline(request.deadline())
                .sido(request.sido())
                .sigungu(request.sigungu())
                .addressDetail(request.addressDetail())
                .careGrade(request.careGrade())
                .elderGender(request.elderGender())
                .elderAgeRange(request.elderAgeRange())
                .mobilityStatus(request.mobilityStatus())
                .mealStatus(request.mealStatus())
                .cognitiveStatus(request.cognitiveStatus())
                .duties(request.duties())
                .requiredDocuments(request.requiredDocuments())
                .exposureType(exposureType)
                .build();

        if (exposureType != ExposureType.NORMAL) {
            jobPosting.extendExposure(EXPOSURE_DAYS);
        }

        return JobPostingResponse.from(jobPostingRepository.save(jobPosting));
    }

    // 다중조건(지역/직종) 동적 검색 — MyBatis 매퍼 사용 (팀 규칙: 동적 쿼리는 MyBatis).
    // 필터/정렬 확장은 2단계에서 진행한다.
    public Page<JobPostingResponse> search(Long viewerMemberId, String region, String jobType, Pageable pageable) {
        JobPostingSearchCondition condition = JobPostingSearchCondition.builder()
                .region(region == null || region.isBlank() ? null : region)
                .jobType(jobType == null || jobType.isBlank() ? null : jobType)
                .offset((int) pageable.getOffset())
                .limit(pageable.getPageSize())
                .build();

        JobSeeker viewerProfile = findViewerProfile(viewerMemberId);

        var content = jobPostingMapper.search(condition).stream()
                .map(jp -> JobPostingResponse.from(jp, scoreOrNull(viewerProfile, jp)))
                .toList();
        long total = jobPostingMapper.countSearch(condition);

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public JobPostingResponse getDetail(Long viewerMemberId, Long jobPostingId) {
        JobPosting jobPosting = findById(jobPostingId);
        jobPosting.increaseViewCount();

        JobSeeker viewerProfile = findViewerProfile(viewerMemberId);
        return JobPostingResponse.from(jobPosting, scoreOrNull(viewerProfile, jobPosting));
    }

    @Transactional
    public JobPostingResponse update(Long memberId, Long jobPostingId, JobPostingUpdateRequest request) {
        JobPosting jobPosting = findById(jobPostingId);
        validateOwner(jobPosting, memberId);

        jobPosting.update(request.toUpdateForm());

        return JobPostingResponse.from(jobPosting);
    }

    @Transactional
    public void delete(Long memberId, Long jobPostingId) {
        JobPosting jobPosting = findById(jobPostingId);
        validateOwner(jobPosting, memberId);
        jobPostingRepository.delete(jobPosting);
    }

    JobPosting findById(Long jobPostingId) {
        return jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new CustomException(ErrorCode.JOB_POSTING_NOT_FOUND));
    }

    private void validateOwner(JobPosting jobPosting, Long memberId) {
        if (!jobPosting.isOwnedBy(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    private JobSeeker findViewerProfile(Long viewerMemberId) {
        if (viewerMemberId == null) {
            return null;
        }
        return jobSeekerRepository.findByMember_Id(viewerMemberId).orElse(null);
    }

    private Integer scoreOrNull(JobSeeker viewerProfile, JobPosting jobPosting) {
        return viewerProfile == null ? null : MatchingScoreCalculator.calculate(viewerProfile, jobPosting);
    }
}
