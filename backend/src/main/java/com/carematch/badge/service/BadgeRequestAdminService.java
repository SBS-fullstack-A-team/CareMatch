package com.carematch.badge.service;

import com.carematch.badge.domain.BadgeRequest;
import com.carematch.badge.domain.BadgeRequestStatus;
import com.carematch.badge.repository.BadgeRequestRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.notification.domain.NotificationType;
import com.carematch.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 관리자용 "인증구직자" 마크 신청 심사(승인/반려).
 * 승인 시 {@link com.carematch.member.domain.JobSeekerProfile#grantBadge} 로 실제 마크를 붙인다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeRequestAdminService {

    private final BadgeRequestRepository badgeRequestRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<BadgeRequestReviewItem> list(BadgeRequestStatus status, Pageable pageable) {
        Page<BadgeRequest> page = (status == null)
                ? badgeRequestRepository.findAll(pageable)
                : badgeRequestRepository.findByStatus(status, pageable);
        return page.map(this::toItem);
    }

    @Transactional
    public BadgeRequestReviewItem approve(Long badgeRequestId) {
        BadgeRequest badgeRequest = load(badgeRequestId);
        assertPending(badgeRequest);
        LocalDateTime now = LocalDateTime.now();
        badgeRequest.approve(now);
        badgeRequest.getJobSeekerProfile().grantBadge(now);
        log.info("[BadgeRequestAdmin] approved badgeRequestId={} profileId={}",
                badgeRequestId, badgeRequest.getJobSeekerProfile().getId());
        notificationService.notify(badgeRequest.getJobSeekerProfile().getMember().getId(),
                NotificationType.BADGE_GRANTED,
                "인증구직자 마크가 부여되었습니다.", "/mypage");
        return toItem(badgeRequest);
    }

    @Transactional
    public BadgeRequestReviewItem reject(Long badgeRequestId, String reason) {
        BadgeRequest badgeRequest = load(badgeRequestId);
        assertPending(badgeRequest);
        badgeRequest.reject(reason, LocalDateTime.now());
        log.info("[BadgeRequestAdmin] rejected badgeRequestId={} reason={}", badgeRequestId, reason);
        notificationService.notify(badgeRequest.getJobSeekerProfile().getMember().getId(),
                NotificationType.BADGE_REJECTED,
                "인증구직자 마크 신청이 반려되었습니다: " + reason, "/mypage");
        return toItem(badgeRequest);
    }

    private void assertPending(BadgeRequest badgeRequest) {
        if (badgeRequest.getStatus() != BadgeRequestStatus.PENDING) {
            throw new BusinessException(ErrorCode.BADGE_REQUEST_ALREADY_PROCESSED, "badgeRequest " + badgeRequest.getId());
        }
    }

    private BadgeRequest load(Long id) {
        return badgeRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BADGE_REQUEST_NOT_FOUND, "badgeRequest " + id));
    }

    private BadgeRequestReviewItem toItem(BadgeRequest b) {
        return new BadgeRequestReviewItem(
                b.getId(),
                b.getJobSeekerProfile().getId(),
                b.getJobSeekerProfile().getMember().getId(),
                b.getJobSeekerProfile().getMember().getName(),
                b.getStatus().name(),
                b.getRequestedAt(),
                b.getDecidedAt(),
                b.getRejectReason());
    }

    public record BadgeRequestReviewItem(
            Long badgeRequestId,
            Long jobSeekerProfileId,
            Long memberId,
            String memberName,
            String status,
            LocalDateTime requestedAt,
            LocalDateTime decidedAt,
            String rejectReason
    ) {
    }
}
