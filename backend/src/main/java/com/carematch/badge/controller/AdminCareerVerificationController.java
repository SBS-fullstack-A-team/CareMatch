package com.carematch.badge.controller;

import com.carematch.badge.domain.CareerVerificationStatus;
import com.carematch.badge.service.CareerVerificationAdminService;
import com.carematch.badge.service.CareerVerificationAdminService.CareerVerificationReviewItem;
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
 * 관리자: 경력 인증 심사(승인/반려). (경로가 /api/admin/** 이므로 SecurityFilterChain 에서도 ADMIN 강제)
 */
@RestController
@RequestMapping("/api/admin/career-verifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCareerVerificationController {

    private final CareerVerificationAdminService careerVerificationAdminService;

    @GetMapping
    public Page<CareerVerificationReviewItem> list(
            @RequestParam(required = false) CareerVerificationStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return careerVerificationAdminService.list(status, pageable);
    }

    @PostMapping("/{careerVerificationId}/approve")
    public CareerVerificationReviewItem approve(@PathVariable Long careerVerificationId) {
        return careerVerificationAdminService.approve(careerVerificationId);
    }

    @PostMapping("/{careerVerificationId}/reject")
    public CareerVerificationReviewItem reject(@PathVariable Long careerVerificationId,
                                               @RequestBody RejectRequest request) {
        return careerVerificationAdminService.reject(careerVerificationId, request.reason());
    }

    public record RejectRequest(@NotBlank String reason) {
    }
}
