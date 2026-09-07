package com.carematch.storage;

import java.time.OffsetDateTime;

/**
 * 업로드용 URL 발급 결과.
 *
 * @param fileKey      스토리지 오브젝트 키 (엔티티에 저장할 값)
 * @param uploadUrl    클라이언트가 PUT 으로 파일을 올릴 임시 URL
 * @param httpMethod   업로드 시 사용할 메서드 (보통 PUT)
 * @param expiresAt    업로드 URL 만료 시각
 */
public record UploadUrlResponse(
        String fileKey,
        String uploadUrl,
        String httpMethod,
        OffsetDateTime expiresAt
) {
}
