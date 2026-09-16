package com.carematch.member.controller;

import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.AdminMemberSummary;
import com.carematch.member.service.AdminMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자: 전체 회원 조회. (경로가 /api/admin/** 이므로 SecurityFilterChain 에서도 ADMIN 강제)
 */
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    @GetMapping
    public Page<AdminMemberSummary> search(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) MemberStatus status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return adminMemberService.search(role, status, keyword, pageable);
    }

    /** 구직회원에게 "인증구직자" 마크를 직접 부여/해제한다 (정상 심사 절차 우회, 운영 편의용). */
    @PatchMapping("/{memberId}/verified-badge")
    public AdminMemberSummary setVerifiedBadge(@PathVariable Long memberId, @RequestBody SetVerifiedBadgeRequest request) {
        return adminMemberService.setVerifiedBadge(memberId, request.granted());
    }

    public record SetVerifiedBadgeRequest(boolean granted) {
    }
}
