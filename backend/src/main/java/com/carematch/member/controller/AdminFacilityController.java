package com.carematch.member.controller;

import com.carematch.member.domain.FacilityApprovalStatus;
import com.carematch.member.service.FacilityApprovalService;
import com.carematch.member.service.FacilityApprovalService.FacilityApprovalItem;
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
 * 관리자: 시설회원 승인/반려. (경로가 /api/admin/** 이므로 SecurityFilterChain 에서도 ADMIN 강제)
 */
@RestController
@RequestMapping("/api/admin/facilities")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFacilityController {

    private final FacilityApprovalService facilityApprovalService;

    @GetMapping
    public Page<FacilityApprovalItem> list(
            @RequestParam(required = false) FacilityApprovalStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return facilityApprovalService.list(status, pageable);
    }

    @PostMapping("/{facilityProfileId}/approve")
    public FacilityApprovalItem approve(@PathVariable Long facilityProfileId) {
        return facilityApprovalService.approve(facilityProfileId);
    }

    @PostMapping("/{facilityProfileId}/reject")
    public FacilityApprovalItem reject(@PathVariable Long facilityProfileId,
                                       @RequestBody RejectRequest request) {
        return facilityApprovalService.reject(facilityProfileId, request.reason());
    }

    public record RejectRequest(@NotBlank String reason) {
    }
}
