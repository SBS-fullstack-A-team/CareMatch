package com.carematch.service;


import com.carematch.entity.EmploymentStatus;
import com.carematch.entity.JobSeeker;
import com.carematch.repository.JobSeekerRepository;
import com.carematch.entity.ContactUnlock;
import com.carematch.repository.ContactUnlockRepository;
import com.carematch.entity.JobPosting;
import com.carematch.repository.JobPostingRepository;
import com.carematch.entity.JobPostingStatus;
import com.carematch.dto.JobSeekerContactResponse;
import com.carematch.dto.JobSeekerCreateRequest;
import com.carematch.dto.JobSeekerResponse;
import com.carematch.service.MatchingScoreCalculator;
import com.carematch.entity.Member;
import com.carematch.repository.MemberRepository;
import com.carematch.entity.Role;
import com.carematch.service.PointService;
import com.carematch.global.exception.CustomException;
import com.carematch.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobSeekerService {

    // 인재 연락처 열람 비용 (최초 1회만 차감, 이후 재열람 무료 — ContactUnlock으로 판별)
    private static final int CONTACT_UNLOCK_COST = 300;

    private final JobSeekerRepository jobSeekerRepository;
    private final MemberRepository memberRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ContactUnlockRepository contactUnlockRepository;
    private final PointService pointService;

    @Transactional
    public JobSeekerResponse register(Long memberId, JobSeekerCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        JobSeeker jobSeeker = JobSeeker.builder()
                .member(member)
                .name(request.name())
                .region(request.region())
                .residenceRegion(request.residenceRegion())
                .desiredJobType(request.desiredJobType())
                .career(request.career())
                .desiredPay(request.desiredPay())
                .build();

        return JobSeekerResponse.from(jobSeekerRepository.save(jobSeeker));
    }

    public Page<JobSeekerResponse> list(Long viewerMemberId, Pageable pageable) {
        List<JobPosting> viewerOpenPostings = viewerMemberId == null
                ? List.of()
                : jobPostingRepository.findByMember_IdAndStatus(viewerMemberId, JobPostingStatus.OPEN);

        return jobSeekerRepository.findAll(pageable)
                .map(js -> JobSeekerResponse.from(js, bestScoreOrNull(viewerOpenPostings, js)));
    }

    public JobSeekerResponse getDetail(Long jobSeekerId) {
        return JobSeekerResponse.from(findById(jobSeekerId));
    }

    /** 연락처 + 실거주지 열람. 처음 열람하는 구인자에게만 포인트를 차감하고, 이후엔 무료로 다시 보여준다. */
    @Transactional
    public JobSeekerContactResponse getContactInfo(Long employerMemberId, Long jobSeekerId) {
        Member employer = memberRepository.findById(employerMemberId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        if (employer.getRole() != Role.EMPLOYER) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        JobSeeker jobSeeker = findById(jobSeekerId);

        if (jobSeeker.getEmploymentStatus() == EmploymentStatus.EMPLOYED) {
            throw new CustomException(ErrorCode.JOB_SEEKER_ALREADY_EMPLOYED);
        }

        boolean alreadyUnlocked = contactUnlockRepository
                .existsByEmployer_IdAndJobSeeker_Id(employerMemberId, jobSeekerId);

        if (!alreadyUnlocked) {
            pointService.use(employerMemberId, CONTACT_UNLOCK_COST, "인재 연락처 열람");
            contactUnlockRepository.save(
                    ContactUnlock.builder()
                            .employer(employer)
                            .jobSeeker(jobSeeker)
                            .build()
            );
        }

        Member applicant = jobSeeker.getMember();
        return new JobSeekerContactResponse(applicant.getPhone(), jobSeeker.getResidenceRegion());
    }

    @Transactional
    public void delete(Long memberId, Long jobSeekerId) {
        JobSeeker jobSeeker = findById(jobSeekerId);
        if (!jobSeeker.isOwnedBy(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        jobSeekerRepository.delete(jobSeeker);
    }

    JobSeeker findById(Long jobSeekerId) {
        return jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new CustomException(ErrorCode.JOB_SEEKER_NOT_FOUND));
    }

    private Integer bestScoreOrNull(List<JobPosting> viewerOpenPostings, JobSeeker jobSeeker) {
        if (viewerOpenPostings.isEmpty()) {
            return null;
        }
        return viewerOpenPostings.stream()
                .mapToInt(jp -> MatchingScoreCalculator.calculate(jobSeeker, jp))
                .max()
                .orElse(0);
    }
}
