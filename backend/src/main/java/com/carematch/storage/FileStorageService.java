package com.carematch.storage;

import java.time.Duration;

/**
 * 파일 스토리지 추상화. 스토리지 벤더 미확정(R2 등 후보) →
 * 특정 SDK 에 의존하지 않고 이 인터페이스로만 사용한다.
 *
 * 백엔드는 파일 바이트를 직접 받지 않는다. 대신:
 *  1) issueUploadUrl(): 클라이언트가 직접 PUT 할 업로드용(임시) URL 발급
 *  2) 클라이언트가 스토리지로 업로드
 *  3) confirmUpload(): 실제 존재/크기/확장자 검증 (스토리지 확정 후 구현)
 *  4) issueDownloadUrl(): 열람 권한자에게 만료시간 있는 서명 URL 발급
 *
 * 현재 구현체: StubFileStorageService (외부 연동 없이 더미 값 반환)
 */
public interface FileStorageService {

    /**
     * 업로드용 임시 URL 발급.
     *
     * @param purpose     파일 용도(경로 prefix 결정). 예: BUSINESS_LICENSE, CERTIFICATE
     * @param originalFilename 원본 파일명(확장자 추출용)
     * @param contentType 업로드 예정 Content-Type
     * @return 스토리지 키 + 업로드 URL + 만료
     */
    UploadUrlResponse issueUploadUrl(FilePurpose purpose, String originalFilename, String contentType);

    /**
     * 업로드 완료 후 실제 파일 검증.
     * 스토리지 확정 전까지는 스텁이 항상 "검증됨(더미 메타)"을 반환한다.
     */
    FileMetadata confirmUpload(String fileKey);

    /**
     * 열람 권한자에게 제공할 서명(만료) 다운로드 URL 발급.
     * 영구 공개 URL 을 반환하지 않는다.
     */
    String issueDownloadUrl(String fileKey, Duration ttl);
}
