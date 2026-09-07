package com.carematch.certificate.dto;

import jakarta.validation.constraints.NotBlank;

public final class CertificateDtos {

    private CertificateDtos() {
    }

    /**
     * 자격증 등록. fileKey 는 먼저 POST /api/files/upload-url (purpose=CERTIFICATE) 로 발급받은 값.
     */
    public record CreateCertificateRequest(
            @NotBlank String certificateName,
            String certificateNumber,
            @NotBlank String fileKey
    ) {
    }

    public record CertificateDetailResponse(
            Long id,
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
