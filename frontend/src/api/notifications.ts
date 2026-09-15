/** 알림 API. docs/API.md §13 */
import { apiFetch } from '@/lib/api-client'
import type { NotificationResponse, PageResponse, UnreadCountResponse } from '@/types/api'

export function getNotifications(
  unreadOnly = false,
  page = 0,
  size = 20,
): Promise<PageResponse<NotificationResponse>> {
  const params = new URLSearchParams({
    unreadOnly: String(unreadOnly),
    page: String(page),
    size: String(size),
  })
  return apiFetch<PageResponse<NotificationResponse>>(`/api/notifications?${params}`)
}

/** 헤더 배지 폴링용 — 목록 전체를 안 받아도 되게 가볍다. */
export function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>('/api/notifications/unread-count')
}

export function markNotificationRead(notificationId: number): Promise<void> {
  return apiFetch<void>(`/api/notifications/${notificationId}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>('/api/notifications/read-all', { method: 'PATCH' })
}
