package com.carematch.application.service;

import com.carematch.application.domain.Application;
import com.carematch.application.domain.ApplicationStatus;
import com.carematch.application.dto.ApplicationDtos.ApplicantResponse;
import com.carematch.application.dto.ApplicationDtos.ApplyRequest;
import com.carematch.application.dto.ApplicationDtos.MyApplicationResponse;
import com.carematch.application.repository.ApplicationRepository;
import com.carematch.certificate.domain.Certificate;
import com.carematch.certificate.repository.CertificateRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.jobposting.repository.JobPostingRepository;
import com.carematch.jobposting.service.MatchScoreCalculator;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.repository.JobSeekerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 구직 지원(구직신청). 구직자가 OPEN 공고에 지원하고, 시설이 수락/반려한다.
 * 접근 제어: SecurityFilterChain(role) + 서비스에서 소유권(지원자 본인 / 공고 작성 시설) 재확인.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ApplicationRepository applicationRepository;
    private final JobPostingRepository jobPostingRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final CertificateRepository certificateRepository;
    private final MatchScoreCalculator matchScoreCalculator;

    /** 구직자가 공고에 지원. 취소했던 이력이 있으면 되살린다. */
    @Transactional
    public Long apply(Long memberId, Long jobPostingId, ApplyRequest req) {
        JobPosting posting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        if (posting.getStatus() != JobPostingStatus.OPEN) {
            throw new BusinessException(ErrorCode.APPLICATION_POSTING_CLOSED, "status=" + posting.getStatus());
        }
        JobSeekerProfile seeker = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "jobseeker profile of member " + memberId));

        Application existing = applicationRepository
                .findByJobPostingIdAndJobSeekerProfileId(jobPostingId, seeker.getId())
                .orElse(null);
        if (existing != null) {
            existing.reapply(req.message());   // CANCELED 가 아니면 APPLICATION_ALREADY_EXISTS
            return existing.getId();
        }
        try {
            return applicationRepository.save(Application.builder()
                    .jobPosting(posting).jobSeekerProfile(seeker).message(req.message()).build()).getId();
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.APPLICATION_ALREADY_EXISTS, "concurrent");
        }
    }

    /** 지원자 본인이 취소 (APPLIED 상태에서만). */
    @Transactional
    public void cancel(Long memberId, Long applicationId) {
        ownApplication(memberId, applicationId).cancel();
    }

    /** 시설(공고 작성자)이 수락/반려 (APPLIED 상태에서만). */
    @Transactional
    public void decide(Long facilityMemberId, Long applicationId, ApplicationStatus decision) {
        if (decision != ApplicationStatus.ACCEPTED && decision != ApplicationStatus.REJECTED) {
            throw new BusinessException(ErrorCode.APPLICATION_INVALID_STATE, "decision=" + decision);
        }
        Application application = facilityApplication(facilityMemberId, applicationId);
        if (decision == ApplicationStatus.ACCEPTED) {
            application.accept();
        } else {
            application.reject();
        }
    }

    /** 시설이 보는 특정 공고의 지원자 목록. */
    public PageResponse<ApplicantResponse> applicantsOfPosting(Long facilityMemberId, Long jobPostingId,
                                                              ApplicationStatus status, int page, int size) {
        JobPosting posting = jobPostingRepository.findWithFacilityById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        if (!posting.isOwnedBy(facilityMemberId)) {
            throw new BusinessException(ErrorCode.JOB_POSTING_ACCESS_DENIED, "memberId=" + facilityMemberId);
        }

        Page<Application> result = applicationRepository.findApplicantsOfPosting(jobPostingId, status, pageable(page, size));
        Map<Long, List<String>> certNames = certificateNames(result.getContent());
        return PageResponse.of(result, a -> ApplicantResponse.from(
                a,
                certNames.getOrDefault(a.getJobSeekerProfile().getId(), List.of()),
                matchScoreCalculator.score(a.getJobSeekerProfile(), posting)));
    }

    /** 구직자가 보는 내 지원 내역. */
    public PageResponse<MyApplicationResponse> myApplications(Long memberId, ApplicationStatus status,
                                                             int page, int size) {
        return PageResponse.of(
                applicationRepository.findMyApplications(memberId, status, pageable(page, size)),
                MyApplicationResponse::from);
    }

    // ---------------------------------------------------------------------

    private Application ownApplication(Long memberId, Long applicationId) {
        Application application = load(applicationId);
        if (!application.isAppliedBy(memberId)) {
            throw new BusinessException(ErrorCode.APPLICATION_NOT_FOUND, "not applicant, memberId=" + memberId);
        }
        return application;
    }

    private Application facilityApplication(Long facilityMemberId, Long applicationId) {
        Application application = load(applicationId);
        if (!application.isForFacility(facilityMemberId)) {
            throw new BusinessException(ErrorCode.APPLICATION_NOT_FOUND, "not facility, memberId=" + facilityMemberId);
        }
        return application;
    }

    private Application load(Long applicationId) {
        return applicationRepository.findWithDetailsById(applicationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APPLICATION_NOT_FOUND, "id=" + applicationId));
    }

    private static PageRequest pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
    }

    private Map<Long, List<String>> certificateNames(List<Application> applications) {
        if (applications.isEmpty()) {
            return Map.of();
        }
        List<Long> profileIds = applications.stream()
                .map(a -> a.getJobSeekerProfile().getId()).distinct().toList();
        return certificateRepository.findByJobSeekerProfileIdIn(profileIds).stream()
                .collect(Collectors.groupingBy(
                        c -> c.getJobSeekerProfile().getId(),
                        Collectors.mapping(Certificate::getCertificateName, Collectors.toList())));
    }
}
