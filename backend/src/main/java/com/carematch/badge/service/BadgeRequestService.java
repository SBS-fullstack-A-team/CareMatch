package com.carematch.badge.service;

import com.carematch.badge.domain.BadgeRequest;
import com.carematch.badge.domain.BadgeRequestStatus;
import com.carematch.badge.domain.CareerVerificationStatus;
import com.carematch.badge.dto.BadgeRequestDtos.BadgeRequestResponse;
import com.carematch.badge.repository.BadgeRequestRepository;
import com.carematch.badge.repository.CareerVerificationRepository;
import com.carematch.certificate.domain.CertificateReviewStatus;
import com.carematch.certificate.repository.CertificateRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.repository.JobSeekerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * "인증구직자" 마크 신청(구직자 본인).
 * 제출 전제조건: 관리자 승인된 자격증 ≥1건 AND 관리자 승인된 경력인증 ≥1건.
 * 실제 마크 부여는 관리자가 이 요청을 최종 승인할 때 이루어진다
 * ({@link BadgeRequestAdminService#approve}).
 */
@Service
@RequiredArgsConstructor
public class BadgeRequestService {

    private final BadgeRequestRepository badgeRequestRepository;
    private final CertificateRepository certificateRepository;
    private final CareerVerificationRepository careerVerificationRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;

    @Transactional
    public BadgeRequestResponse request(Long memberId) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));

        if (profile.isVerifiedBadge()) {
            throw new BusinessException(ErrorCode.BADGE_ALREADY_GRANTED, "profile " + profile.getId());
        }
        if (badgeRequestRepository.existsByJobSeekerProfileIdAndStatus(profile.getId(), BadgeRequestStatus.PENDING)) {
            throw new BusinessException(ErrorCode.BADGE_REQUEST_ALREADY_PENDING, "profile " + profile.getId());
        }
        boolean hasApprovedCertificate = certificateRepository
                .existsByJobSeekerProfileIdAndAdminReviewStatus(profile.getId(), CertificateReviewStatus.APPROVED);
        boolean hasApprovedCareer = careerVerificationRepository
                .existsByJobSeekerProfileIdAndStatus(profile.getId(), CareerVerificationStatus.APPROVED);
        if (!hasApprovedCertificate || !hasApprovedCareer) {
            throw new BusinessException(ErrorCode.BADGE_REQUIREMENTS_NOT_MET, "profile " + profile.getId());
        }

        BadgeRequest badgeRequest = BadgeRequest.builder()
                .jobSeekerProfile(profile)
                .build();
        badgeRequestRepository.save(badgeRequest);
        return toResponse(badgeRequest);
    }

    @Transactional(readOnly = true)
    public List<BadgeRequestResponse> listMine(Long memberId) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));
        return badgeRequestRepository.findByJobSeekerProfileIdOrderByRequestedAtDesc(profile.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    private BadgeRequestResponse toResponse(BadgeRequest b) {
        return new BadgeRequestResponse(b.getId(), b.getStatus().name(), b.getRequestedAt(), b.getDecidedAt(), b.getRejectReason());
    }
}
