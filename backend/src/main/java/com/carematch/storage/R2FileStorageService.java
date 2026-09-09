package com.carematch.storage;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Cloudflare R2(S3 호환) 구현체.
 *
 * - 백엔드는 파일 바이트를 다루지 않는다. presigned URL 만 발급.
 *   업로드: {@code presignPutObject} → 클라이언트가 그 URL 로 직접 PUT (같은 Content-Type 헤더 필수)
 *   확인:  {@code headObject} 로 존재/크기/타입 검증
 *   다운로드: {@code presignGetObject} (TTL 있음, 영구 공개 URL 아님)
 * - 활성 조건: carematch.storage.provider=r2 (기본은 stub)
 * - 접속 정보: carematch.storage.r2.* (R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)
 */
@Slf4j
@Service
@ConditionalOnProperty(prefix = "carematch.storage", name = "provider", havingValue = "r2")
public class R2FileStorageService implements FileStorageService {

    private final StorageProperties props;
    private final S3Client s3;
    private final S3Presigner presigner;

    public R2FileStorageService(StorageProperties props, R2Properties r2) {
        if (!r2.isConfigured()) {
            throw new IllegalStateException(
                    "carematch.storage.provider=r2 인데 carematch.storage.r2.endpoint / access-key-id / "
                            + "secret-access-key 가 설정되지 않았습니다. (R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
        }
        this.props = props;

        var credentials = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(r2.accessKeyId(), r2.secretAccessKey()));
        URI endpoint = URI.create(r2.endpoint());
        // R2 presigned PUT 호환: path-style + chunked encoding 끔
        S3Configuration serviceConfig = S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .chunkedEncodingEnabled(false)
                .build();

        this.s3 = S3Client.builder()
                .region(Region.of("auto")) // R2 는 region 무시하지만 SDK 는 필수
                .endpointOverride(endpoint)
                .credentialsProvider(credentials)
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .serviceConfiguration(serviceConfig)
                .build();
        this.presigner = S3Presigner.builder()
                .region(Region.of("auto"))
                .endpointOverride(endpoint)
                .credentialsProvider(credentials)
                .serviceConfiguration(serviceConfig)
                .build();

        log.info("[R2] 초기화 완료 endpoint={} bucket={}", endpoint, props.bucket());
    }

    @Override
    public UploadUrlResponse issueUploadUrl(FilePurpose purpose, String originalFilename, String contentType) {
        if (!props.isContentTypeAllowed(contentType)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE, "contentType=" + contentType);
        }
        String fileKey = buildKey(purpose, originalFilename);
        Duration ttl = Duration.ofSeconds(props.presignExpirySeconds());

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(props.bucket())
                .key(fileKey)
                .contentType(contentType)
                .build();
        var presigned = presigner.presignPutObject(b -> b
                .signatureDuration(ttl)
                .putObjectRequest(putRequest));

        OffsetDateTime expiresAt = OffsetDateTime.now().plus(ttl);
        log.info("[R2] issueUploadUrl purpose={} key={}", purpose, fileKey);
        return new UploadUrlResponse(fileKey, presigned.url().toString(), "PUT", expiresAt);
    }

    @Override
    public FileMetadata confirmUpload(String fileKey) {
        HeadObjectResponse head;
        try {
            head = s3.headObject(b -> b.bucket(props.bucket()).key(fileKey));
        } catch (NoSuchKeyException e) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND, "key=" + fileKey);
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                throw new BusinessException(ErrorCode.FILE_NOT_FOUND, "key=" + fileKey);
            }
            throw e;
        }

        long size = head.contentLength() == null ? 0L : head.contentLength();
        String contentType = head.contentType();

        if (size <= 0) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND, "key=" + fileKey + " (빈 파일)");
        }
        if (size > props.maxUploadSizeBytes()) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE,
                    "size=" + size + " > limit=" + props.maxUploadSizeBytes());
        }
        if (!props.isContentTypeAllowed(contentType)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE, "contentType=" + contentType);
        }
        return new FileMetadata(true, size, contentType);
    }

    @Override
    public String issueDownloadUrl(String fileKey, Duration ttl) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(props.bucket())
                .key(fileKey)
                .build();
        var presigned = presigner.presignGetObject(b -> b
                .signatureDuration(ttl)
                .getObjectRequest(getRequest));
        return presigned.url().toString();
    }

    @PreDestroy
    public void close() {
        s3.close();
        presigner.close();
    }

    private String buildKey(FilePurpose purpose, String originalFilename) {
        String ext = extractExtension(originalFilename);
        String datePath = OffsetDateTime.now().toString().substring(0, 7).replace("-", "/"); // yyyy/MM
        return "%s/%s/%s%s".formatted(purpose.prefix(), datePath, UUID.randomUUID(), ext);
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return (dot < 0 || dot == filename.length() - 1) ? "" : filename.substring(dot).toLowerCase();
    }
}
