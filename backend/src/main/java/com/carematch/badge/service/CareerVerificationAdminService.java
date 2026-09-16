package com.carematch.badge.service;

import com.carematch.badge.domain.CareerVerification;
import com.carematch.badge.domain.CareerVerificationStatus;
import com.carematch.badge.repository.CareerVerificationRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.notification.domain.NotificationType;
import com.carematch.notification.service.NotificationService;
import com.carematch.storage.FileStorageService;
import com.carematch.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 관리자용 경력 인증 심사(승인/반려).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CareerVerificationAdminService {

    private final CareerVerificationRepository careerVerificationRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final StorageProperties storageProperties;

    @Transactional(readOnly = true)
    public Page<CareerVerificationReviewItem> list(CareerVerificationStatus status, Pageable pageable) {
        Page<CareerVerification> page = (status == null)
                ? careerVerificationRepository.findAll(pageable)
                : careerVerificationRepository.findByStatus(status, pageable);
        return page.map(this::toItem);
    }

    @Transactional
    public CareerVerificationReviewItem approve(Long careerVerificationId) {
        CareerVerification careerVerification = load(careerVerificationId);
        assertPending(careerVerification);
        careerVerification.approve(LocalDateTime.now());
        log.info("[CareerVerificationAdmin] approved careerVerificationId={}", careerVerificationId);
        notificationService.notify(careerVerification.getJobSeekerProfile().getMember().getId(),
                NotificationType.CAREER_VERIFICATION_APPROVED,
                "경력(" + careerVerification.getOrganizationName() + ") 인증이 승인되었습니다.", "/mypage");
        return toItem(careerVerification);
    }

    @Transactional
    public CareerVerificationReviewItem reject(Long careerVerificationId, String reason) {
        CareerVerification careerVerification = load(careerVerificationId);
        assertPending(careerVerification);
        careerVerification.reject(reason, LocalDateTime.now());
        log.info("[CareerVerificationAdmin] rejected careerVerificationId={} reason={}", careerVerificationId, reason);
        notificationService.notify(careerVerification.getJobSeekerProfile().getMember().getId(),
                NotificationType.CAREER_VERIFICATION_REJECTED,
                "경력(" + careerVerification.getOrganizationName() + ") 인증이 반려되었습니다: " + reason, "/mypage");
        return toItem(careerVerification);
    }

    private void assertPending(CareerVerification careerVerification) {
        if (careerVerification.getStatus() != CareerVerificationStatus.PENDING) {
            throw new BusinessException(ErrorCode.CAREER_VERIFICATION_ALREADY_REVIEWED, "careerVerification " + careerVerification.getId());
        }
    }

    private CareerVerification load(Long id) {
        return careerVerificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CAREER_VERIFICATION_NOT_FOUND, "careerVerification " + id));
    }

    /** 증빙 파일 서명 URL. 파일 없이 만들어진 예전 데이터는 null. */
    private String downloadUrl(CareerVerification c) {
        if (c.getFileKey() == null) {
            return null;
        }
        return fileStorageService.issueDownloadUrl(c.getFileKey(),
                java.time.Duration.ofSeconds(storageProperties.presignExpirySeconds()));
    }

    private CareerVerificationReviewItem toItem(CareerVerification c) {
        return new CareerVerificationReviewItem(
                c.getId(),
                c.getJobSeekerProfile().getId(),
                c.getJobSeekerProfile().getMember().getId(),
                c.getJobSeekerProfile().getMember().getName(),
                c.getOrganizationName(),
                c.getRoleTitle(),
                c.getStartDate(),
                c.getEndDate(),
                c.getDescription(),
                c.getStatus().name(),
                c.getRejectReason(),
                c.getCreatedAt(),
                downloadUrl(c));
    }

    public record CareerVerificationReviewItem(
            Long careerVerificationId,
            Long jobSeekerProfileId,
            Long memberId,
            String memberName,
            String organizationName,
            String roleTitle,
            LocalDate startDate,
            LocalDate endDate,
            String description,
            String status,
            String rejectReason,
            LocalDateTime createdAt,
            /** 증빙 파일 서명(만료) URL. 파일이 없으면 null. */
            String downloadUrl
    ) {
    }
}
