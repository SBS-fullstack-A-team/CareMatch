package com.carematch.member.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.common.masking.MaskingUtil;
import com.carematch.contact.service.ContactUnlockService;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.CertificateResponse;
import com.carematch.member.dto.JobSeekerProfileResponse;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.point.StubPointService;
import com.carematch.storage.FileStorageService;
import com.carematch.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

/**
 * 구직자 프로필 조회.
 * - 시설회원 대상: 연락처/거주지 마스킹, 이미 열람했으면 언마스크. 자격증은 서명 URL 제공.
 * - 본인 대상: 전체 언마스크.
 */
@Service
@RequiredArgsConstructor
public class JobSeekerProfileQueryService {

    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final ContactUnlockService contactUnlockService;
    private final FileStorageService fileStorageService;
    private final StorageProperties storageProperties;

    /** 시설회원이 보는 인재 상세 (기본 마스킹). */
    @Transactional(readOnly = true)
    public JobSeekerProfileResponse getForFacility(Long profileId, Long facilityMemberId) {
        JobSeekerProfile profile = load(profileId);

        boolean unlocked = !profile.isEmployed()
                && contactUnlockService.hasUnlocked(facilityMemberId, profileId);

        String phone = unlocked
                ? profile.getMember().getPhone()
                : MaskingUtil.maskPhone(profile.getMember().getPhone());
        String residence = unlocked
                ? profile.getResidence()
                : MaskingUtil.maskResidence(profile.getResidence());

        return build(profile, phone, residence, unlocked, signedCertificates(profile));
    }

    /** 본인이 보는 내 프로필 (전체 공개). */
    @Transactional(readOnly = true)
    public JobSeekerProfileResponse getMine(Long memberId) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));
        return build(profile, profile.getMember().getPhone(), profile.getResidence(), true, signedCertificates(profile));
    }

    private JobSeekerProfile load(Long profileId) {
        return jobSeekerProfileRepository.findWithDetailsById(profileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobSeekerProfile " + profileId));
    }

    private List<CertificateResponse> signedCertificates(JobSeekerProfile profile) {
        Duration ttl = Duration.ofSeconds(storageProperties.presignExpirySeconds());
        return profile.getCertificates().stream()
                .map(c -> CertificateResponse.withUrl(c, fileStorageService.issueDownloadUrl(c.getFileKey(), ttl)))
                .toList();
    }

    private JobSeekerProfileResponse build(JobSeekerProfile profile, String phone, String residence,
                                           boolean unlocked, List<CertificateResponse> certs) {
        return new JobSeekerProfileResponse(
                profile.getId(),
                profile.getMember().getId(),
                profile.getMember().getName(),
                profile.getEmploymentStatus().name(),
                phone,
                residence,
                profile.getIntroduction(),
                unlocked,
                StubPointService.CONTACT_UNLOCK_COST,
                certs);
    }
}
