package com.carematch.certificate.service;

import com.carematch.certificate.domain.CertificateType;
import com.carematch.certificate.dto.CertificateDtos.CreateCertificateRequest;
import com.carematch.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CertificateServiceNameTest {

    private static CreateCertificateRequest req(CertificateType type, String name) {
        return new CreateCertificateRequest(type, name, "num", "key");
    }

    @Test
    void 정형_종류는_입력_이름을_무시하고_라벨로_저장() {
        assertThat(CertificateService.resolveName(req(CertificateType.CAREGIVER, "아무거나")))
                .isEqualTo("요양보호사");
        assertThat(CertificateService.resolveName(req(CertificateType.SOCIAL_WORKER_1, null)))
                .isEqualTo("사회복지사 1급");
    }

    @Test
    void OTHER_는_입력_이름을_그대로_쓰되_공백은_400() {
        assertThat(CertificateService.resolveName(req(CertificateType.OTHER, " 치매전문교육 이수 ")))
                .isEqualTo("치매전문교육 이수");
        assertThatThrownBy(() -> CertificateService.resolveName(req(CertificateType.OTHER, "  ")))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> CertificateService.resolveName(req(CertificateType.OTHER, null)))
                .isInstanceOf(BusinessException.class);
    }
}
