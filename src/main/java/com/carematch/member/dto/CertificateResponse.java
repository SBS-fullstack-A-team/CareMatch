package com.carematch.member.dto;

import com.carematch.certificate.domain.Certificate;

/**
 * 자격증 응답.
 * downloadUrl 은 열람 권한자에게만 "서명(만료) URL" 로 채워지고,
 * 그 외에는 null (영구 공개 URL 노출 금지).
 */
public record CertificateResponse(
        Long id,
        String certificateName,
        String certificateNumber,
        String status,
        String downloadUrl
) {
    public static CertificateResponse withoutUrl(Certificate c) {
        return new CertificateResponse(c.getId(), c.getCertificateName(),
                c.getCertificateNumber(), c.getStatus().name(), null);
    }

    public static CertificateResponse withUrl(Certificate c, String signedUrl) {
        return new CertificateResponse(c.getId(), c.getCertificateName(),
                c.getCertificateNumber(), c.getStatus().name(), signedUrl);
    }
}
