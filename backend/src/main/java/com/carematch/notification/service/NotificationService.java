package com.carematch.notification.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.notification.domain.Notification;
import com.carematch.notification.domain.NotificationType;
import com.carematch.notification.dto.NotificationDtos.NotificationResponse;
import com.carematch.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 알림 생성/조회. 실시간 푸시·이메일 없이 서버가 이벤트 시점에 행을 하나 쌓고,
 * 프론트가 주기적으로 폴링해서 안읽음 배지/목록을 그린다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private static final int MAX_PAGE_SIZE = 50;

    private final NotificationRepository notificationRepository;

    /** 다른 도메인 서비스(지원 결과, 시설 승인, 문의 답변 등)가 이벤트 시점에 호출한다. */
    @Transactional
    public void notify(Long memberId, NotificationType type, String message, String link) {
        notificationRepository.save(Notification.builder()
                .memberId(memberId)
                .type(type)
                .message(message)
                .link(link)
                .build());
    }

    public PageResponse<NotificationResponse> list(Long memberId, boolean unreadOnly, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        var result = unreadOnly
                ? notificationRepository.findByMemberIdAndReadFalseOrderByCreatedAtDesc(memberId, pageable)
                : notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable);
        return PageResponse.of(result, NotificationResponse::from);
    }

    public long unreadCount(Long memberId) {
        return notificationRepository.countByMemberIdAndReadFalse(memberId);
    }

    @Transactional
    public void markRead(Long memberId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndMemberId(notificationId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND, "id=" + notificationId));
        notification.markRead();
    }

    @Transactional
    public void markAllRead(Long memberId) {
        notificationRepository.markAllRead(memberId);
    }
}
