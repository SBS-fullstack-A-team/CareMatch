package com.carematch.certificate.controller;

import com.carematch.certificate.domain.CertificateReviewStatus;
import com.carematch.certificate.service.CertificateAdminService;
import com.carematch.certificate.service.CertificateAdminService.CertificateReviewItem;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자: 자격증 진위 심사(승인/반려). (경로가 /api/admin/** 이므로 SecurityFilterChain 에서도 ADMIN 강제)
 */
@RestController
@RequestMapping("/api/admin/certificates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCertificateController {

    private final CertificateAdminService certificateAdminService;

    @GetMapping
    public Page<CertificateReviewItem> list(
            @RequestParam(required = false) CertificateReviewStatus adminReviewStatus,
            @PageableDefault(size = 20) Pageable pageable) {
        return certificateAdminService.list(adminReviewStatus, pageable);
    }

    @PostMapping("/{certificateId}/approve")
    public CertificateReviewItem approve(@PathVariable Long certificateId) {
        return certificateAdminService.approve(certificateId);
    }

    @PostMapping("/{certificateId}/reject")
    public CertificateReviewItem reject(@PathVariable Long certificateId, @RequestBody RejectRequest request) {
        return certificateAdminService.reject(certificateId, request.reason());
    }

    public record RejectRequest(@NotBlank String reason) {
    }
}
