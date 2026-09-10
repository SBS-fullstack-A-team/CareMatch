package com.carematch.storage;

import com.carematch.common.exception.BusinessException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * presign 경로만 검증한다 (네트워크 불필요 — SDK 는 URL 을 로컬에서 서명).
 * confirmUpload(HeadObject) 는 실제 R2 가 필요해 여기서 다루지 않는다.
 */
class R2FileStorageServiceTest {

    private R2FileStorageService service;

    @BeforeEach
    void setUp() {
        StorageProperties props = new StorageProperties(
                "r2",
                "carematch-test",
                "https://files.example.invalid",
                600L,
                5_242_880L,
                List.of("image/jpeg", "image/png", "application/pdf"));
        R2Properties r2 = new R2Properties(
                "https://acc123.r2.cloudflarestorage.com", "test-ak", "test-sk");
        service = new R2FileStorageService(props, r2);
    }

    @AfterEach
    void tearDown() {
        service.close();
    }

    @Test
    void issueUploadUrl_presigned_PUT_URL을_돌려준다() {
        UploadUrlResponse res =
                service.issueUploadUrl(FilePurpose.CERTIFICATE, "cert.pdf", "application/pdf");

        assertThat(res.httpMethod()).isEqualTo("PUT");
        assertThat(res.fileKey()).startsWith("certificate/").endsWith(".pdf");
        assertThat(res.uploadUrl())
                .startsWith("https://acc123.r2.cloudflarestorage.com/carematch-test/certificate/")
                .contains("X-Amz-Signature=")
                .contains("X-Amz-Expires=600");
        assertThat(res.expiresAt()).isAfter(OffsetDateTime.now());
    }

    @Test
    void issueUploadUrl_허용되지_않은_contentType은_거부() {
        assertThatThrownBy(() ->
                service.issueUploadUrl(FilePurpose.CERTIFICATE, "x.exe", "application/octet-stream"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void issueDownloadUrl_presigned_GET_URL을_돌려준다() {
        String url = service.issueDownloadUrl("certificate/2026/09/abc.pdf", Duration.ofMinutes(5));

        assertThat(url)
                .startsWith(
                        "https://acc123.r2.cloudflarestorage.com/carematch-test/certificate/2026/09/abc.pdf")
                .contains("X-Amz-Signature=")
                .contains("X-Amz-Expires=300");
    }

    @Test
    void R2Properties_미설정이면_생성_시_예외() {
        StorageProperties props = new StorageProperties(
                "r2", "b", "u", 600L, 1L, List.of("image/png"));
        assertThatThrownBy(() -> new R2FileStorageService(props, new R2Properties(null, null, null)))
                .isInstanceOf(IllegalStateException.class);
    }
}
