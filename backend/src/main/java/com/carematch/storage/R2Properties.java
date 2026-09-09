package com.carematch.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * carematch.storage.r2.* — Cloudflare R2(S3 호환) 접속 정보.
 * carematch.storage.provider=r2 일 때만 R2FileStorageService 가 사용한다.
 * 값은 전부 환경변수(R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)로 주입.
 */
@ConfigurationProperties(prefix = "carematch.storage.r2")
public record R2Properties(
        /** S3 API 엔드포인트. 예: https://&lt;account_id&gt;.r2.cloudflarestorage.com */
        String endpoint,
        String accessKeyId,
        String secretAccessKey
) {
    public boolean isConfigured() {
        return hasText(endpoint) && hasText(accessKeyId) && hasText(secretAccessKey);
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
