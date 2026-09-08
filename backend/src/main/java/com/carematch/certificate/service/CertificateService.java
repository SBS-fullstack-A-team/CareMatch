package com.carematch.certificate.service;

import com.carematch.certificate.domain.Certificate;
import com.carematch.certificate.dto.CertificateDtos.CertificateDetailResponse;
import com.carematch.certificate.dto.CertificateDtos.CreateCertificateRequest;
import com.carematch.certificate.repository.CertificateRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.storage.FileMetadata;
import com.carematch.storage.FileStorageService;
import com.carematch.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

/**
 * 요양보호사 자격증 등록/검증/조회.
 *
 * 보안 원칙:
 *  - 백엔드는 파일 바이트를 받지 않는다(업로드 URL 방식).
 *  - 파일 URL 은 영구 공개 URL 이 아니라 "서명(만료) URL" 로만 제공한다.
 *  - 실제 파일 존재/크기/확장자 검증은 스토리지 확정 후 confirmUpload 구현에서 채운다.
 *    지금은 스텁이 더미 메타(존재함)를 반환하므로 구조만 완성돼 있다.
 */
@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final FileStorageService fileStorageService;
    private final StorageProperties storageProperties;

    @Transactional
    public CertificateDetailResponse register(Long memberId, CreateCertificateRequest req) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));

        Certificate certificate = Certificate.builder()
                .jobSeekerProfile(profile)
                .certificateName(req.certificateName())
                .certificateNumber(req.certificateNumber())
                .fileKey(req.fileKey())
                .build();
        profile.addCertificate(certificate);
        certificateRepository.save(certificate);

        return toDetail(certificate);
    }

    /**
     * 업로드 확인/검증 자리.
     * 스토리지 웹훅 또는 클라이언트가 업로드 완료 후 호출 → 존재/크기/확장자 검증.
     * (스토리지 확정 전까지는 스텁 메타 기준으로 통과/보류만 판정)
     */
    @Transactional
    public CertificateDetailResponse verify(Long memberId, Long certificateId) {
        Certificate certificate = loadOwned(memberId, certificateId);

        FileMetadata meta = fileStorageService.confirmUpload(certificate.getFileKey());
        if (!meta.exists()) {
            certificate.markRejected("파일을 찾을 수 없습니다.");
        } else if (meta.sizeBytes() > storageProperties.maxUploadSizeBytes()) {
            certificate.markRejected("허용 용량 초과");
        } else if (!storageProperties.isContentTypeAllowed(meta.contentType())) {
            certificate.markRejected("허용되지 않은 파일 형식: " + meta.contentType());
        } else {
            certificate.markVerified(meta.sizeBytes(), meta.contentType());
        }
        return toDetail(certificate);
    }

    @Transactional(readOnly = true)
    public List<CertificateDetailResponse> listMine(Long memberId) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));
        return certificateRepository.findByJobSeekerProfileId(profile.getId()).stream()
                .map(this::toDetail)
                .toList();
    }

    @Transactional
    public void delete(Long memberId, Long certificateId) {
        Certificate certificate = loadOwned(memberId, certificateId);
        certificateRepository.delete(certificate);
    }

    private Certificate loadOwned(Long memberId, Long certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "certificate " + certificateId));
        if (!certificate.getJobSeekerProfile().getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "not owner of certificate " + certificateId);
        }
        return certificate;
    }

    private CertificateDetailResponse toDetail(Certificate c) {
        Duration ttl = Duration.ofSeconds(storageProperties.presignExpirySeconds());
        String url = fileStorageService.issueDownloadUrl(c.getFileKey(), ttl);
        return new CertificateDetailResponse(
                c.getId(), c.getCertificateName(), c.getCertificateNumber(), c.getStatus().name(),
                c.getFileSize(), c.getContentType(), url, c.getRejectReason());
    }
}
