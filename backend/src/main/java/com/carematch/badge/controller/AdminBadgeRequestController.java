package com.carematch.badge.controller;

import com.carematch.badge.domain.BadgeRequestStatus;
import com.carematch.badge.service.BadgeRequestAdminService;
import com.carematch.badge.service.BadgeRequestAdminService.BadgeRequestReviewItem;
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
 * 관리자: "인증구직자" 마크 신청 심사(승인/반려). (경로가 /api/admin/** 이므로 SecurityFilterChain 에서도 ADMIN 강제)
 */
@RestController
@RequestMapping("/api/admin/badge-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBadgeRequestController {

    private final BadgeRequestAdminService badgeRequestAdminService;

    @GetMapping
    public Page<BadgeRequestReviewItem> list(
            @RequestParam(required = false) BadgeRequestStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return badgeRequestAdminService.list(status, pageable);
    }

    @PostMapping("/{badgeRequestId}/approve")
    public BadgeRequestReviewItem approve(@PathVariable Long badgeRequestId) {
        return badgeRequestAdminService.approve(badgeRequestId);
    }

    @PostMapping("/{badgeRequestId}/reject")
    public BadgeRequestReviewItem reject(@PathVariable Long badgeRequestId, @RequestBody RejectRequest request) {
        return badgeRequestAdminService.reject(badgeRequestId, request.reason());
    }

    public record RejectRequest(@NotBlank String reason) {
    }
}
