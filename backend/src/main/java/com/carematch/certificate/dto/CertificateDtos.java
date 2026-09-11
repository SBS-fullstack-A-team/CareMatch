package com.carematch.certificate.dto;

import com.carematch.certificate.domain.CertificateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class CertificateDtos {

    private CertificateDtos() {
    }

    /**
     * 자격증 등록. fileKey 는 먼저 POST /api/files/upload-url (purpose=CERTIFICATE) 로 발급받은 값.
     * certificateName 은 {@code certificateType == OTHER} 일 때만 사용(필수), 그 외에는 무시하고
     * {@link CertificateType#label()} 로 저장한다.
     */
    public record CreateCertificateRequest(
            @NotNull CertificateType certificateType,
            String certificateName,
            String certificateNumber,
            @NotBlank String fileKey
    ) {
    }

    public record CertificateDetailResponse(
            Long id,
            String certificateType,
            String certificateName,
            String certificateNumber,
            String status,
            Long fileSize,
            String contentType,
            String downloadUrl,   // 서명(만료) URL
            String rejectReason
    ) {
    }
}
