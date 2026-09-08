package com.carematch.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * carematch.storage.* 바인딩. 스토리지 벤더 확정 전까지 키 이름만 선점.
 */
@ConfigurationProperties(prefix = "carematch.storage")
public record StorageProperties(
        String provider,
        String bucket,
        String publicBaseUrl,
        long presignExpirySeconds,
        long maxUploadSizeBytes,
        List<String> allowedContentTypes
) {
    public boolean isContentTypeAllowed(String contentType) {
        return contentType != null && allowedContentTypes != null
                && allowedContentTypes.stream().anyMatch(ct -> ct.equalsIgnoreCase(contentType));
    }
}
