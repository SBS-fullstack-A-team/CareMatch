package com.carematch.notification.dto;

import com.carematch.notification.domain.Notification;
import java.time.LocalDateTime;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record NotificationResponse(
            Long id,
            String type,
            String message,
            String link,
            boolean read,
            LocalDateTime createdAt
    ) {
        public static NotificationResponse from(Notification n) {
            return new NotificationResponse(
                    n.getId(), n.getType().name(), n.getMessage(), n.getLink(), n.isRead(), n.getCreatedAt());
        }
    }

    public record UnreadCountResponse(long count) {
    }
}
