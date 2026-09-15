import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Select } from '@/components/ui/select'
import { getAdminInquiries } from '@/api/admin'
import { ApiError } from '@/lib/api-client'
import type { InquiryResponse, SpringPage } from '@/types/api'
import { formatServerDateTime, LoadFailed, PageLoading } from '@/pages/Support/shared'
import { InquiryStatusBadge } from '@/pages/Support/status-badge'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { AdminPageHeader, AdminTotalCount } from './shared'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'PENDING', label: '답변대기' },
  { value: 'ANSWERED', label: '답변완료' },
]

/** 관리자 — 문의관리. 전체 1:1 문의를 작성자 정보와 함께 확인·답변한다. */
export function AdminInquiriesPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<InquiryResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getAdminInquiries({
      status: (status || undefined) as 'PENDING' | 'ANSWERED' | undefined,
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false))
  }, [status, page])

  useEffect(load, [load])

  return (
    <div>
      <AdminPageHeader title="문의관리" description="회원이 남긴 1:1 문의를 확인하고 답변할 수 있습니다." />

      <div className="w-full sm:w-48">
        <Select
          options={STATUS_OPTIONS.slice(1)}
          placeholder={STATUS_OPTIONS[0].label}
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
        />
      </div>

      <div className="mt-5">
        {loading ? (
          <PageLoading rows={6} />
        ) : error ? (
          <LoadFailed message={error} onRetry={load} />
        ) : !data || data.content.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState title="등록된 문의가 없습니다." />
          </div>
        ) : (
          <>
            <AdminTotalCount count={data.totalElements} />

            <ul className="overflow-hidden rounded-card border border-border bg-surface">
              {data.content.map((inquiry) => (
                <li key={inquiry.id} className="border-b border-border last:border-b-0">
                  <Link
                    to={`/mypage/admin/inquiries/${inquiry.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-primary-light/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <InquiryStatusBadge status={inquiry.status} />
                        <span className="truncate text-base font-semibold text-fg">{inquiry.title}</span>
                      </span>
                      <span className="mt-1 block text-sm text-fg-muted">
                        {inquiry.memberName ?? '탈퇴/비회원'}
                        {inquiry.memberEmail && ` · ${inquiry.memberEmail}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-fg-subtle tabular">
                      {formatServerDateTime(inquiry.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </div>
  )
}
