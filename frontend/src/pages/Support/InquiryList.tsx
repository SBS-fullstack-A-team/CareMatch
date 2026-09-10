import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { Pagination } from '@/components/common/pagination'
import { buttonVariants } from '@/components/ui/button'
import { getMyInquiries } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { cn, formatNumber } from '@/lib/utils'
import type { InquiryResponse, SpringPage } from '@/types/api'
import {
  formatServerDate,
  LoadFailed,
  LoginRequired,
  PageLoading,
  SupportPage,
  useSupportAuthGate,
} from './shared'
import { InquiryStatusBadge } from './status-badge'

const PAGE_SIZE = 10

/** 내 문의 목록. 서버 Page 는 0-base 라 Pagination(1-base) 에 넣을 때 +1 한다. */
export function SupportInquiryListPage() {
  const { user, authReady } = useSupportAuthGate()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<InquiryResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    (targetPage: number) => {
      if (!user) return
      setLoading(true)
      setError(null)
      getMyInquiries(targetPage - 1, PAGE_SIZE)
        .then(setData)
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'),
        )
        .finally(() => setLoading(false))
    },
    [user],
  )

  useEffect(() => {
    if (authReady && user) load(page)
  }, [authReady, user, load, page])

  return (
    <SupportPage
      crumbs={[{ label: '고객센터', to: '/support' }, { label: '내 문의' }]}
      title="내 문의"
      description="남기신 문의와 답변을 확인하실 수 있습니다."
    >
      {!authReady ? (
        <PageLoading rows={2} />
      ) : !user ? (
        <LoginRequired
          from="/support/inquiries"
          description="내가 남긴 문의는 로그인 후 확인할 수 있습니다."
        />
      ) : loading ? (
        <PageLoading rows={4} />
      ) : error ? (
        <LoadFailed message={error} onRetry={() => load(page)} />
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState
            title="남기신 문의가 없습니다."
            description="궁금한 점이 있으시면 1:1 문의로 남겨주세요."
            action={
              <Link
                to="/support/inquiry"
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
              >
                1:1 문의하기
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base text-fg-muted">
              전체{' '}
              <strong className="font-bold text-primary-deep tabular">
                {formatNumber(data.totalElements)}
              </strong>
              건
            </p>
            <Link
              to="/support/inquiry"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
            >
              1:1 문의하기
            </Link>
          </div>

          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {data.content.map((inquiry) => (
              <li key={inquiry.id} className="border-b border-border last:border-b-0">
                <Link
                  to={`/support/inquiries/${inquiry.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-light/40"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <InquiryStatusBadge status={inquiry.status} />
                    <span className="truncate text-base text-fg">{inquiry.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-fg-subtle tabular">
                    {formatServerDate(inquiry.createdAt)}
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
