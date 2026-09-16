package com.carematch.badge.controller;

import com.carematch.badge.dto.BadgeRequestDtos.BadgeRequestResponse;
import com.carematch.badge.service.BadgeRequestService;
import com.carematch.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "인증구직자" 마크 신청 — 구직자 본인만.
 * 승인된 자격증·경력인증이 각 1건 이상이어야 신청 가능 (미충족 시 400 BADGE_006).
 */
@RestController
@RequestMapping("/api/badge-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('JOBSEEKER')")
public class BadgeRequestController {

    private final BadgeRequestService badgeRequestService;

    @PostMapping
    public ResponseEntity<BadgeRequestResponse> request(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(badgeRequestService.request(principal.getMemberId()));
    }

    @GetMapping("/me")
    public List<BadgeRequestResponse> listMine(@AuthenticationPrincipal CustomUserDetails principal) {
        return badgeRequestService.listMine(principal.getMemberId());
    }
}
