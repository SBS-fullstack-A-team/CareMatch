package com.carematch.storage;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * FileStorageService 의 스텁 구현체.
 * - 외부 스토리지 연동 없음. 더미 URL 을 반환한다.
 * - 스토리지(R2 등) 확정 시 이 클래스만 실제 구현체로 교체하면 된다.
 * - "영구 공개 URL" 구조는 피하기 위해 다운로드 URL 에도 만료 쿼리파라미터를 흉내낸다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StubFileStorageService implements FileStorageService {

    private final StorageProperties props;

    @Override
    public UploadUrlResponse issueUploadUrl(FilePurpose purpose, String originalFilename, String contentType) {
        // 확장자/타입 사전 검증 (실제 파일 검증은 confirmUpload 에서)
        if (!props.isContentTypeAllowed(contentType)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE, "contentType=" + contentType);
        }
        String ext = extractExtension(originalFilename);
        String datePath = OffsetDateTime.now().toString().substring(0, 7).replace("-", "/"); // yyyy/MM
        String fileKey = "%s/%s/%s%s".formatted(purpose.prefix(), datePath, UUID.randomUUID(), ext);

        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(props.presignExpirySeconds());
        String uploadUrl = "%s/_stub-upload/%s?expires=%d"
                .formatted(trimTrailingSlash(props.publicBaseUrl()), fileKey, expiresAt.toEpochSecond());

        log.info("[StubFileStorage] issueUploadUrl purpose={} key={} (dummy)", purpose, fileKey);
        return new UploadUrlResponse(fileKey, uploadUrl, "PUT", expiresAt);
    }

    @Override
    public FileMetadata confirmUpload(String fileKey) {
        // TODO(storage 확정 후): 스토리지 HEAD 요청으로 존재/크기/타입 확인.
        // 스텁은 항상 "존재함 + 더미 메타" 반환.
        log.info("[StubFileStorage] confirmUpload key={} -> dummy VERIFIED", fileKey);
        String contentType = fileKey.endsWith(".pdf") ? "application/pdf" : "image/jpeg";
        return new FileMetadata(true, 1024L, contentType);
    }

    @Override
    public String issueDownloadUrl(String fileKey, Duration ttl) {
        long expires = OffsetDateTime.now().plus(ttl).toEpochSecond();
        // 서명값은 스텁이므로 고정 더미. 구조상 만료 파라미터를 항상 포함.
        return "%s/_stub-download/%s?expires=%d&sig=stub-signature"
                .formatted(trimTrailingSlash(props.publicBaseUrl()), fileKey, expires);
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return (dot < 0 || dot == filename.length() - 1) ? "" : filename.substring(dot).toLowerCase();
    }

    private String trimTrailingSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
