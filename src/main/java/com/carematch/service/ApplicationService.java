package com.carematch.service;


import com.carematch.entity.Application;
import com.carematch.entity.ApplicationStatus;
import com.carematch.repository.ApplicationRepository;
import com.carematch.dto.ApplicationCreateRequest;
import com.carematch.dto.ApplicationResponse;
import com.carematch.entity.JobPosting;
import com.carematch.repository.JobPostingRepository;
import com.carematch.entity.JobSeeker;
import com.carematch.repository.JobSeekerRepository;
import com.carematch.entity.Member;
import com.carematch.repository.MemberRepository;
import com.carematch.global.exception.CustomException;
import com.carematch.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobPostingRepository jobPostingRepository;
    private final MemberRepository memberRepository;
    private final JobSeekerRepository jobSeekerRepository;

    @Transactional
    public ApplicationResponse apply(Long applicantId, Long jobPostingId, ApplicationCreateRequest request) {
        if (applicationRepository.existsByJobPosting_IdAndApplicant_Id(jobPostingId, applicantId)) {
            throw new CustomException(ErrorCode.DUPLICATE_APPLICATION);
        }

        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new CustomException(ErrorCode.JOB_POSTING_NOT_FOUND));
        Member applicant = memberRepository.findById(applicantId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        Application application = Application.builder()
                .jobPosting(jobPosting)
                .applicant(applicant)
                .message(request.message())
                .build();

        return ApplicationResponse.from(applicationRepository.save(application));
    }

    public List<ApplicationResponse> getMyApplications(Long applicantId) {
        return applicationRepository.findByApplicant_Id(applicantId).stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    public List<ApplicationResponse> getApplicationsForPosting(Long memberId, Long jobPostingId) {
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new CustomException(ErrorCode.JOB_POSTING_NOT_FOUND));

        if (!jobPosting.isOwnedBy(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        return applicationRepository.findByJobPosting_Id(jobPostingId).stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    @Transactional
    public ApplicationResponse updateStatus(Long memberId, Long applicationId, String status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new CustomException(ErrorCode.APPLICATION_NOT_FOUND));

        if (!application.isPostingOwner(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        switch (status) {
            case "ACCEPTED" -> {
                application.accept();
                // 지원이 수락되면 해당 구직자의 인재정보를 자동으로 취업완료 처리한다 (등록해둔 경우에 한함).
                jobSeekerRepository.findByMember_Id(application.getApplicant().getId())
                        .ifPresent(JobSeeker::markAsEmployed);
            }
            case "REJECTED" -> application.reject();
            default -> throw new CustomException(ErrorCode.INVALID_APPLICATION_STATUS);
        }

        return ApplicationResponse.from(application);
    }

    @Transactional
    public void cancel(Long memberId, Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new CustomException(ErrorCode.APPLICATION_NOT_FOUND));

        if (!application.isApplicant(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new CustomException(ErrorCode.INVALID_APPLICATION_STATUS);
        }

        application.cancel();
    }
}
