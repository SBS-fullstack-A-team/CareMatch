import { FileText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { approveFacility, getAdminFacilities, rejectFacility } from '@/api/admin'
import { ApiError } from '@/lib/api-client'
import type { FacilityApprovalItem, FacilityApprovalStatus, SpringPage } from '@/types/api'
import { formatServerDateTime, LoadFailed, PageLoading } from '@/pages/Support/shared'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { AdminPageHeader, AdminTotalCount } from './shared'

const PAGE_SIZE = 10

const FACILITY_TYPE_LABEL: Record<string, string> = {
  VISITING_CARE: '방문요양센터',
  NURSING_HOME: '요양원',
  DAY_NIGHT_CARE: '주야간보호센터',
  COMMUNITY_CARE: '재가복지센터',
  NURSING_HOSPITAL: '요양병원',
  ETC: '기타',
}

const STATUS_TABS: { value: FacilityApprovalStatus | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '승인 대기' },
  { value: 'APPROVED', label: '승인 완료' },
  { value: 'REJECTED', label: '반려' },
]

const STATUS_BADGE: Record<FacilityApprovalStatus, { label: string; variant: 'new' | 'neutralOutline' | 'closing' }> = {
  PENDING: { label: '승인 대기', variant: 'neutralOutline' },
  APPROVED: { label: '승인 완료', variant: 'new' },
  REJECTED: { label: '반려', variant: 'closing' },
}

/** 관리자 — 시설관리. 시설회원 가입 승인/반려 + 사업자등록증 열람. */
export function AdminFacilitiesPage() {
  const { toast } = useToast()
  const [status, setStatus] = useState<FacilityApprovalStatus | ''>('PENDING')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<FacilityApprovalItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<FacilityApprovalItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getAdminFacilities({ status: status || undefined, page: page - 1, size: PAGE_SIZE })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false))
  }, [status, page])

  useEffect(load, [load])

  const handleApprove = async (item: FacilityApprovalItem) => {
    setProcessingId(item.facilityProfileId)
    try {
      await approveFacility(item.facilityProfileId)
      toast({ title: `${item.facilityName} 승인이 완료되었습니다.` })
      load()
    } catch (err) {
      toast({
        variant: 'error',
        title: '승인 처리에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const openReject = (item: FacilityApprovalItem) => {
    setRejectTarget(item)
    setRejectReason('')
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setProcessingId(rejectTarget.facilityProfileId)
    try {
      await rejectFacility(rejectTarget.facilityProfileId, rejectReason.trim())
      toast({ title: `${rejectTarget.facilityName} 가입이 반려되었습니다.` })
      setRejectTarget(null)
      load()
    } catch (err) {
      toast({
        variant: 'error',
        title: '반려 처리에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="시설관리"
        description="시설회원 가입을 승인·반려하고 사업자등록증을 확인할 수 있습니다."
      />

      <SegmentedControl
        items={STATUS_TABS}
        value={status}
        onChange={(value) => {
          setPage(1)
          setStatus(value)
        }}
      />

      <div className="mt-5">
        {loading ? (
          <PageLoading rows={4} />
        ) : error ? (
          <LoadFailed message={error} onRetry={load} />
        ) : !data || data.content.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState title="해당 조건의 시설회원이 없습니다." />
          </div>
        ) : (
          <>
            <AdminTotalCount count={data.totalElements} />

            <ul className="space-y-4">
              {data.content.map((item) => {
                const badge = STATUS_BADGE[item.approvalStatus]
                const busy = processingId === item.facilityProfileId
                return (
                  <li key={item.facilityProfileId} className="rounded-card border border-border bg-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-fg">{item.facilityName}</h2>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {item.facilityType && (
                            <Badge variant="neutral">{FACILITY_TYPE_LABEL[item.facilityType] ?? item.facilityType}</Badge>
                          )}
                        </div>
                        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-fg-muted sm:grid-cols-2">
                          <div>
                            <dt className="inline text-fg-subtle">담당자 </dt>
                            <dd className="inline text-fg">{item.memberName}</dd>
                          </div>
                          <div>
                            <dt className="inline text-fg-subtle">연락처 </dt>
                            <dd className="inline text-fg">{item.memberPhone ?? '-'}</dd>
                          </div>
                          <div>
                            <dt className="inline text-fg-subtle">이메일 </dt>
                            <dd className="inline text-fg">{item.memberEmail}</dd>
                          </div>
                          <div>
                            <dt className="inline text-fg-subtle">사업자등록번호 </dt>
                            <dd className="inline tabular text-fg">{item.businessRegistrationNumber}</dd>
                          </div>
                          <div>
                            <dt className="inline text-fg-subtle">가입일 </dt>
                            <dd className="inline tabular text-fg">{formatServerDateTime(item.createdAt)}</dd>
                          </div>
                          {item.rejectReason && (
                            <div className="sm:col-span-2">
                              <dt className="inline text-fg-subtle">반려 사유 </dt>
                              <dd className="inline text-danger">{item.rejectReason}</dd>
                            </div>
                          )}
                        </dl>

                        {item.businessLicenseUrl ? (
                          <a
                            href={item.businessLicenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-deep underline underline-offset-4 hover:text-primary"
                          >
                            <FileText className="size-4" aria-hidden />
                            사업자등록증 보기
                          </a>
                        ) : (
                          <p className="mt-3 text-sm text-fg-subtle">첨부된 사업자등록증이 없습니다.</p>
                        )}
                      </div>

                      {item.approvalStatus === 'PENDING' && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => openReject(item)}
                          >
                            반려
                          </Button>
                          <Button type="button" size="sm" disabled={busy} onClick={() => handleApprove(item)}>
                            {busy ? '처리 중…' : '승인'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />
          </>
        )}
      </div>

      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="가입 반려"
        description={rejectTarget ? `${rejectTarget.facilityName} 가입을 반려합니다.` : undefined}
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setRejectTarget(null)}>
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!rejectReason.trim() || processingId !== null}
              onClick={handleReject}
            >
              반려하기
            </Button>
          </>
        }
      >
        <label className="mb-1.5 block text-sm font-semibold text-fg">반려 사유</label>
        <Textarea
          rows={4}
          placeholder="반려 사유를 입력해 주세요. 신청자에게 안내됩니다."
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
      </Modal>
    </div>
  )
}
