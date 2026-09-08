package com.carematch.storage;

/**
 * 업로드 완료된 파일의 검증 결과 메타데이터.
 *
 * @param exists      스토리지에 실제 존재하는지
 * @param sizeBytes   파일 크기
 * @param contentType 실제 Content-Type
 */
public record FileMetadata(
        boolean exists,
        long sizeBytes,
        String contentType
) {
}
