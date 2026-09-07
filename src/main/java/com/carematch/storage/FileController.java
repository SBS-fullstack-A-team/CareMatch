package com.carematch.storage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * 업로드용 URL 발급 / 업로드 완료 확인.
 * 백엔드는 파일 바이트를 직접 받지 않는다 — 클라이언트가 발급된 URL 로 직접 PUT.
 *
 * 현재 FileStorageService 는 스텁 → 더미 URL / 더미 메타 반환.
 * 스토리지(R2 등) 확정 시 구현체만 교체.
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload-url")
    public UploadUrlResponse issueUploadUrl(@Valid @RequestBody IssueUploadUrlRequest request) {
        return fileStorageService.issueUploadUrl(request.purpose(), request.originalFilename(), request.contentType());
    }

    @PostMapping("/confirm")
    public FileMetadata confirm(@Valid @RequestBody ConfirmUploadRequest request) {
        return fileStorageService.confirmUpload(request.fileKey());
    }

    public record IssueUploadUrlRequest(
            @NotNull FilePurpose purpose,
            @NotBlank String originalFilename,
            @NotBlank String contentType
    ) {
    }

    public record ConfirmUploadRequest(
            @NotBlank String fileKey
    ) {
    }
}
