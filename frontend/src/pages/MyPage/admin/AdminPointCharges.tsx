import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { getAdminPointCharges } from '@/api/admin'
import { ApiError } from '@/lib/api-client'
import { formatNumber } from '@/lib/utils'
import type { AdminPointChargeSummary, SpringPage } from '@/types/api'
import { formatServerDateTime, LoadFailed, PageLoading } from '@/pages/Support/shared'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { AdminPageHeader, AdminTotalCount } from './shared'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'PAID', label: '충전 완료' },
  { value: 'PENDING', label: '충전 대기(미완료)' },
]

/** 관리자 — 포인트충전관리. 전체 회원의 포인트 충전(포트원 결제) 내역을 확인한다. */
export function AdminPointChargesPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<AdminPointChargeSummary> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getAdminPointCharges({
      status: (status || undefined) as 'PENDING' | 'PAID' | undefined,
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
      <AdminPageHeader
        title="포인트충전관리"
        description="회원들이 충전한 포인트 내역을 확인할 수 있습니다."
      />

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
            <EmptyState title="충전 내역이 없습니다." />
          </div>
        ) : (
          <>
            <AdminTotalCount count={data.totalElements} />

            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-fg-muted">
                    <th className="px-4 py-3 font-semibold">회원</th>
                    <th className="px-4 py-3 font-semibold">결제 ID</th>
                    <th className="px-4 py-3 text-right font-semibold">충전 금액</th>
                    <th className="px-4 py-3 font-semibold">상태</th>
                    <th className="px-4 py-3 font-semibold">요청일시</th>
                    <th className="px-4 py-3 font-semibold">완료일시</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((charge) => (
                    <tr key={charge.id} className="border-b border-border last:border-b-0 hover:bg-primary-light/20">
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-fg">{charge.memberName}</span>
                        <span className="block text-xs text-fg-subtle">{charge.memberLoginId ?? '-'}</span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-fg-subtle" title={charge.paymentId}>
                        {charge.paymentId}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular text-primary-deep">
                        {formatNumber(charge.amount)}P
                      </td>
                      <td className="px-4 py-3">
                        {charge.status === 'PAID' ? (
                          <Badge variant="new">충전 완료</Badge>
                        ) : (
                          <Badge variant="neutralOutline">충전 대기</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg-subtle tabular">{formatServerDateTime(charge.createdAt)}</td>
                      <td className="px-4 py-3 text-fg-subtle tabular">
                        {charge.completedAt ? formatServerDateTime(charge.completedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </div>
  )
}
