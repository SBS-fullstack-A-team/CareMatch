import { Eye } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { Pagination } from '@/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { getNotices } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { formatNumber } from '@/lib/utils'
import type { NoticeSummary, SpringPage } from '@/types/api'
import { formatServerDate, LoadFailed, PageLoading, SupportPage } from './shared'

const PAGE_SIZE = 10

/** 공지사항 목록. 서버 Page 는 0-base 라 Pagination(1-base) 에 넣을 때 +1 한다. */
export function SupportNoticeListPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<NoticeSummary> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((targetPage: number) => {
    setLoading(true)
    setError(null)
    getNotices(targetPage - 1, PAGE_SIZE)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(page), [load, page])

  return (
    <SupportPage
      crumbs={[{ label: '고객센터', to: '/support' }, { label: '공지사항' }]}
      title="공지사항"
      description="서비스 소식과 이용 안내를 확인하세요."
    >
      {loading ? (
        <PageLoading rows={5} />
      ) : error ? (
        <LoadFailed message={error} onRetry={() => load(page)} />
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState title="등록된 공지가 없습니다." />
        </div>
      ) : (
        <>
          <p className="mb-3 text-base text-fg-muted">
            전체{' '}
            <strong className="font-bold text-primary-deep tabular">
              {formatNumber(data.totalElements)}
            </strong>
            건
          </p>

          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {data.content.map((notice) => (
              <li key={notice.id} className="border-b border-border last:border-b-0">
                <Link
                  to={`/support/notice/${notice.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-light/40"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {notice.pinned && <Badge variant="normal">공지</Badge>}
                    <span className="truncate text-base text-fg">{notice.title}</span>
                  </span>

                  <span className="flex shrink-0 items-center gap-3 text-xs text-fg-subtle">
                    <span className="flex items-center gap-1 tabular">
                      <Eye className="size-4" aria-hidden />
                      {formatNumber(notice.viewCount)}
                    </span>
                    <span className="tabular">{formatServerDate(notice.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            page={data.number + 1}
            totalPages={data.totalPages}
            onChange={setPage}
            className="mt-8"
          />
        </>
      )}
    </SupportPage>
  )
}
