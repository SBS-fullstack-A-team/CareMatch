package com.carematch.member.dto;

import com.carematch.certificate.domain.Certificate;

/**
 * 자격증 응답.
 * downloadUrl 은 열람 권한자에게만 "서명(만료) URL" 로 채워지고,
 * 그 외에는 null (영구 공개 URL 노출 금지).
 * certificateType 은 enum name(docs/ENUM_MAPPING.md §5), certificateName 은 표시용 이름.
 */
public record CertificateResponse(
        Long id,
        String certificateType,
        String certificateName,
        String certificateNumber,
        String status,
        String downloadUrl
) {
    public static CertificateResponse withoutUrl(Certificate c) {
        return new CertificateResponse(c.getId(), c.getCertificateType().name(), c.getCertificateName(),
                c.getCertificateNumber(), c.getStatus().name(), null);
    }

    public static CertificateResponse withUrl(Certificate c, String signedUrl) {
        return new CertificateResponse(c.getId(), c.getCertificateType().name(), c.getCertificateName(),
                c.getCertificateNumber(), c.getStatus().name(), signedUrl);
    }
}
