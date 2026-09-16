import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { buttonVariants } from '@/components/ui/button'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { cn } from '@/lib/utils'
import { formatServerDate, LoadFailed, LoginRequired } from '@/pages/Support/shared'
import type { NotificationType } from '@/types/api'

const PAGE_SIZE = 20

const TYPE_LABEL: Record<NotificationType, string> = {
  APPLICATION_ACCEPTED: '합격 소식',
  APPLICATION_REJECTED: '지원 결과',
  FACILITY_APPROVED: '시설 승인',
  FACILITY_REJECTED: '시설 승인 결과',
  INQUIRY_ANSWERED: '문의 답변',
  CERTIFICATE_REVIEW_APPROVED: '자격증 인증 완료',
  CERTIFICATE_REVIEW_REJECTED: '자격증 인증 결과',
  CAREER_VERIFICATION_APPROVED: '경력 인증 완료',
  CAREER_VERIFICATION_REJECTED: '경력 인증 결과',
  BADGE_GRANTED: '인증구직자 마크',
  BADGE_REJECTED: '인증 마크 신청 결과',
}

/**
 * `/notifications` — 지원 결과·시설 승인·문의 답변 알림.
 * 실시간 푸시 없이 서버가 이벤트 시점에 쌓아둔 행을 조회하는 MVP 수준
 * (헤더 배지는 useApp 의 폴링이 별도로 갱신 — docs/API.md §13).
 */
export function NotificationsPage() {
  const { user, authReady, refreshUnreadCount } = useApp()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [markingAll, setMarkingAll] = useState(false)

  const { data, loading, error, reload } = useAsync(
    () => getNotifications(false, page - 1, PAGE_SIZE),
    [page],
  )

  if (!authReady) return null
  if (!user) {
    return (
      <div className="container-page py-10">
        <LoginRequired from="/notifications" description="로그인하면 나의 알림을 확인할 수 있어요." />
      </div>
    )
  }

  async function handleClick(id: number, link: string | null, read: boolean) {
    if (!read) {
      try {
        await markNotificationRead(id)
        reload()
        void refreshUnreadCount()
      } catch {
        /* 읽음 처리 실패해도 이동은 막지 않는다 */
      }
    }
    if (link) navigate(link)
  }

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      reload()
      void refreshUnreadCount()
    } finally {
      setMarkingAll(false)
    }
  }

  const hasUnread = (data?.content ?? []).some((n) => !n.read)

  return (
    <div className="container-page py-6 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-fg">알림</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
          >
            {markingAll ? '처리 중…' : '모두 읽음으로 표시'}
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="overflow-hidden rounded-card border border-border">
            <LoadingState rows={4} />
          </div>
        ) : error ? (
          <LoadFailed message={error} onRetry={reload} />
        ) : !data || data.content.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState title="아직 알림이 없습니다." description="새 소식이 생기면 여기에 표시돼요." />
          </div>
        ) : (
          <>
            <ul className="overflow-hidden rounded-card border border-border bg-surface">
              {data.content.map((n) => (
                <li key={n.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => void handleClick(n.id, n.link, n.read)}
                    className={cn(
                      'flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-surface-sunken',
                      !n.read && 'bg-primary-light/40',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        n.read ? 'bg-transparent' : 'bg-primary',
                      )}
                    />
                    <Bell className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-fg-muted">
                        {TYPE_LABEL[n.type]}
                      </span>
                      <span className="mt-0.5 block text-base text-fg">{n.message}</span>
                      <span className="mt-1 block text-sm text-fg-subtle">
                        {formatServerDate(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <Pagination page={data.page + 1} totalPages={data.totalPages} onChange={setPage} className="mt-8" />
          </>
        )}
      </div>
    </div>
  )
}
