package com.carematch.certificate.service;

import com.carematch.certificate.domain.Certificate;
import com.carematch.certificate.domain.CertificateReviewStatus;
import com.carematch.certificate.domain.CertificateStatus;
import com.carematch.certificate.repository.CertificateRepository;
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

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 관리자용 자격증 진위 심사(승인/반려).
 * 파일 자체의 존재/크기/확장자 기술검증({@link CertificateStatus})과는 별개로,
 * 사람이 내용을 보고 진짜 자격증인지 최종 판단하는 단계.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateAdminService {

    private final CertificateRepository certificateRepository;
    private final FileStorageService fileStorageService;
    private final StorageProperties storageProperties;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<CertificateReviewItem> list(CertificateReviewStatus adminReviewStatus, Pageable pageable) {
        Page<Certificate> page = (adminReviewStatus == null)
                ? certificateRepository.findAll(pageable)
                : certificateRepository.findByAdminReviewStatus(adminReviewStatus, pageable);
        return page.map(this::toItem);
    }

    @Transactional
    public CertificateReviewItem approve(Long certificateId) {
        Certificate certificate = load(certificateId);
        assertReviewable(certificate);
        certificate.approveByAdmin(LocalDateTime.now());
        log.info("[CertificateAdmin] approved certificateId={}", certificateId);
        notificationService.notify(certificate.getJobSeekerProfile().getMember().getId(),
                NotificationType.CERTIFICATE_REVIEW_APPROVED,
                "자격증(" + certificate.getCertificateName() + ") 인증 심사가 승인되었습니다.", "/mypage");
        return toItem(certificate);
    }

    @Transactional
    public CertificateReviewItem reject(Long certificateId, String reason) {
        Certificate certificate = load(certificateId);
        assertReviewable(certificate);
        certificate.rejectByAdmin(reason, LocalDateTime.now());
        log.info("[CertificateAdmin] rejected certificateId={} reason={}", certificateId, reason);
        notificationService.notify(certificate.getJobSeekerProfile().getMember().getId(),
                NotificationType.CERTIFICATE_REVIEW_REJECTED,
                "자격증(" + certificate.getCertificateName() + ") 인증 심사가 반려되었습니다: " + reason, "/mypage");
        return toItem(certificate);
    }

    private void assertReviewable(Certificate certificate) {
        if (certificate.getStatus() != CertificateStatus.VERIFIED) {
            throw new BusinessException(ErrorCode.CERTIFICATE_FILE_NOT_VERIFIED, "certificate " + certificate.getId());
        }
        if (certificate.getAdminReviewStatus() != CertificateReviewStatus.PENDING) {
            throw new BusinessException(ErrorCode.CERTIFICATE_ALREADY_REVIEWED, "certificate " + certificate.getId());
        }
    }

    private Certificate load(Long certificateId) {
        return certificateRepository.findById(certificateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "certificate " + certificateId));
    }

    private CertificateReviewItem toItem(Certificate c) {
        Duration ttl = Duration.ofSeconds(storageProperties.presignExpirySeconds());
        String url = fileStorageService.issueDownloadUrl(c.getFileKey(), ttl);
        return new CertificateReviewItem(
                c.getId(),
                c.getJobSeekerProfile().getId(),
                c.getJobSeekerProfile().getMember().getId(),
                c.getJobSeekerProfile().getMember().getName(),
                c.getCertificateType().name(),
                c.getCertificateName(),
                c.getCertificateNumber(),
                c.getStatus().name(),
                url,
                c.getAdminReviewStatus().name(),
                c.getAdminReviewReason(),
                c.getReviewedAt(),
                c.getCreatedAt());
    }

    public record CertificateReviewItem(
            Long certificateId,
            Long jobSeekerProfileId,
            Long memberId,
            String memberName,
            String certificateType,
            String certificateName,
            String certificateNumber,
            String fileVerificationStatus,
            String downloadUrl,
            String adminReviewStatus,
            String adminReviewReason,
            LocalDateTime reviewedAt,
            LocalDateTime createdAt
    ) {
    }
}
