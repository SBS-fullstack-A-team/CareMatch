package com.carematch.certificate.controller;

import com.carematch.certificate.dto.CertificateDtos.CertificateDetailResponse;
import com.carematch.certificate.dto.CertificateDtos.CreateCertificateRequest;
import com.carematch.certificate.service.CertificateService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 자격증 등록/검증/조회 — 구직자 본인만.
 * 파일은 먼저 POST /api/files/upload-url (purpose=CERTIFICATE) 로 올린 뒤 fileKey 로 등록.
 */
@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('JOBSEEKER')")
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping
    public ResponseEntity<CertificateDetailResponse> register(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateCertificateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(certificateService.register(principal.getMemberId(), request));
    }

    /** 업로드 완료 후 파일 검증(존재/크기/확장자). 스토리지 확정 전엔 스텁 메타 기준. */
    @PostMapping("/{certificateId}/verify")
    public CertificateDetailResponse verify(@AuthenticationPrincipal CustomUserDetails principal,
                                            @PathVariable Long certificateId) {
        return certificateService.verify(principal.getMemberId(), certificateId);
    }

    @GetMapping("/me")
    public List<CertificateDetailResponse> listMine(@AuthenticationPrincipal CustomUserDetails principal) {
        return certificateService.listMine(principal.getMemberId());
    }

    @DeleteMapping("/{certificateId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable Long certificateId) {
        certificateService.delete(principal.getMemberId(), certificateId);
        return ResponseEntity.noContent().build();
    }
}
