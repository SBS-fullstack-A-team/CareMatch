package com.carematch.notification.controller;

import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.notification.dto.NotificationDtos.NotificationResponse;
import com.carematch.notification.dto.NotificationDtos.UnreadCountResponse;
import com.carematch.notification.service.NotificationService;
import com.carematch.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 회원 알림. 인증만 필요 — 본인 알림만 다룬다(anyRequest().authenticated() 기본 규칙 적용). */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public PageResponse<NotificationResponse> list(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return notificationService.list(principal.getMemberId(), unreadOnly, page, size);
    }

    /** 헤더 배지 폴링용 — 목록 전체를 안 받아도 되게 가볍게 분리. */
    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal CustomUserDetails principal) {
        return new UnreadCountResponse(notificationService.unreadCount(principal.getMemberId()));
    }

    @PatchMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long notificationId) {
        notificationService.markRead(principal.getMemberId(), notificationId);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal CustomUserDetails principal) {
        notificationService.markAllRead(principal.getMemberId());
    }
}
