import { Eye } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getNoticeDetail } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { cn, formatNumber } from '@/lib/utils'
import type { NoticeDetail } from '@/types/api'
import { formatServerDate, PageLoading, SupportPage } from './shared'

/** 공지 상세. 이 API 호출 자체가 서버에서 조회수를 올린다. */
export function SupportNoticeDetailPage() {
  const { noticeId } = useParams()
  const [notice, setNotice] = useState<NoticeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!noticeId) return
    setLoading(true)
    setError(null)
    getNoticeDetail(noticeId)
      .then(setNotice)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404
            ? '요청하신 공지가 삭제되었거나 존재하지 않습니다.'
            : err instanceof ApiError
              ? err.message
              : '잠시 후 다시 시도해 주세요.',
        ),
      )
      .finally(() => setLoading(false))
  }, [noticeId])

  useEffect(load, [load])

  return (
    <SupportPage
      crumbs={[
        { label: '고객센터', to: '/support' },
        { label: '공지사항', to: '/support/notice' },
        { label: '공지 상세' },
      ]}
      title="공지사항"
    >
      {loading ? (
        <PageLoading rows={1} />
      ) : error || !notice ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState
            title="공지를 찾을 수 없습니다."
            description={error ?? undefined}
            action={
              <Link
                to="/support/notice"
                className={cn(buttonVariants({ variant: 'secondary' }))}
              >
                공지사항 목록으로
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <article className="rounded-card border border-border bg-surface p-6 lg:p-8">
            <header className="border-b border-border pb-5">
              {notice.pinned && <Badge variant="normal">공지</Badge>}
              <h2 className={cn('text-2xl font-bold text-fg', notice.pinned && 'mt-2.5')}>
                {notice.title}
              </h2>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
                <span className="tabular">등록일 {formatServerDate(notice.createdAt)}</span>
                <span className="flex items-center gap-1 tabular">
                  <Eye className="size-4" aria-hidden />
                  조회 {formatNumber(notice.viewCount)}
                </span>
              </p>
            </header>

            <div className="pt-6">
              <p className="text-base leading-relaxed whitespace-pre-line text-fg">
                {notice.content}
              </p>
            </div>
          </article>

          <div className="mt-6 flex justify-center">
            <Link to="/support/notice" className={cn(buttonVariants({ variant: 'secondary' }))}>
              목록으로 돌아가기
            </Link>
          </div>
        </>
      )}
    </SupportPage>
  )
}
