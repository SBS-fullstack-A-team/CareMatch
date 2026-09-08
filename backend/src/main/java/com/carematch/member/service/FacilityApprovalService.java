package com.carematch.member.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.FacilityApprovalStatus;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.repository.FacilityProfileRepository;
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
 * 관리자용 시설회원 승인/반려.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FacilityApprovalService {

    private final FacilityProfileRepository facilityProfileRepository;
    private final FileStorageService fileStorageService;
    private final StorageProperties storageProperties;

    @Transactional(readOnly = true)
    public Page<FacilityApprovalItem> list(FacilityApprovalStatus status, Pageable pageable) {
        Page<FacilityProfile> page = (status == null)
                ? facilityProfileRepository.findAll(pageable)
                : facilityProfileRepository.findByApprovalStatus(status, pageable);
        return page.map(this::toItem);
    }

    @Transactional
    public FacilityApprovalItem approve(Long facilityProfileId) {
        FacilityProfile profile = load(facilityProfileId);
        if (profile.getApprovalStatus() == FacilityApprovalStatus.APPROVED) {
            throw new BusinessException(ErrorCode.FACILITY_ALREADY_PROCESSED);
        }
        profile.approve(LocalDateTime.now());
        log.info("[FacilityApproval] approved profileId={}", facilityProfileId);
        return toItem(profile);
    }

    @Transactional
    public FacilityApprovalItem reject(Long facilityProfileId, String reason) {
        FacilityProfile profile = load(facilityProfileId);
        if (profile.getApprovalStatus() == FacilityApprovalStatus.REJECTED) {
            throw new BusinessException(ErrorCode.FACILITY_ALREADY_PROCESSED);
        }
        profile.reject(reason, LocalDateTime.now());
        log.info("[FacilityApproval] rejected profileId={} reason={}", facilityProfileId, reason);
        return toItem(profile);
    }

    private FacilityProfile load(Long id) {
        return facilityProfileRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "facilityProfile " + id));
    }

    private FacilityApprovalItem toItem(FacilityProfile p) {
        String licenseUrl = p.getBusinessLicenseFileKey() == null ? null
                : fileStorageService.issueDownloadUrl(p.getBusinessLicenseFileKey(),
                        Duration.ofSeconds(storageProperties.presignExpirySeconds()));
        return new FacilityApprovalItem(
                p.getId(),
                p.getMember().getId(),
                p.getFacilityName(),
                p.getBusinessRegistrationNumber(),
                p.getApprovalStatus().name(),
                p.getApprovedAt(),
                p.getRejectReason(),
                licenseUrl);
    }

    public record FacilityApprovalItem(
            Long facilityProfileId,
            Long memberId,
            String facilityName,
            String businessRegistrationNumber,
            String approvalStatus,
            LocalDateTime processedAt,
            String rejectReason,
            String businessLicenseUrl
    ) {
    }
}
