import { FileText } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { EmptyState } from '@/components/common/empty-state'
import { Pagination } from '@/components/common/pagination'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
  approveBadgeRequest,
  approveCareerVerification,
  approveCertificate,
  getAdminBadgeRequests,
  getAdminCareerVerifications,
  getAdminCertificates,
  rejectBadgeRequest,
  rejectCareerVerification,
  rejectCertificate,
} from '@/api/admin'
import { certificateTypeLabel } from '@/data/labels'
import { ApiError } from '@/lib/api-client'
import { formatServerDateTime, LoadFailed, PageLoading } from '@/pages/Support/shared'
import type {
  BadgeRequestReviewItem,
  CareerVerificationReviewItem,
  CertificateReviewItem,
  ReviewStatus,
  SpringPage,
} from '@/types/api'
import { AdminPageHeader, AdminTotalCount } from './shared'

const PAGE_SIZE = 10

type TabKey = 'certificates' | 'careers' | 'badges'

const TABS: { value: TabKey; label: string }[] = [
  { value: 'certificates', label: '자격증' },
  { value: 'careers', label: '경력' },
  { value: 'badges', label: '마크 신청' },
]

const STATUS_TABS: { value: ReviewStatus | ''; label: string }[] = [
  { value: 'PENDING', label: '심사 대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: '', label: '전체' },
]

const STATUS_BADGE: Record<ReviewStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: '심사 대기', variant: 'neutralOutline' },
  APPROVED: { label: '승인', variant: 'new' },
  REJECTED: { label: '반려', variant: 'closing' },
}

/** "2024-03-01" + null -> "2024.03.01 ~ 재직중" */
function periodLabel(start: string, end: string | null) {
  const dot = (iso: string) => iso.split('-').join('.')
  return `${dot(start)} ~ ${end ? dot(end) : '재직중'}`
}

/**
 * 관리자 — 인증심사. "인증구직자" 마크가 붙기까지의 3단계를 한 화면에서 처리한다.
 *
 *   자격증 진위 승인 ┐
 *   경력 인증 승인   ┴→ 마크 신청 승인 → 구직자 프로필에 마크 부여
 *
 * 승인·반려하면 백엔드가 신청자에게 알림을 자동 발송한다.
 */
export function AdminVerificationsPage() {
  const [tab, setTab] = useState<TabKey>('certificates')

  return (
    <div>
      <AdminPageHeader
        title="인증심사"
        description="자격증 진위와 경력을 확인하고, 두 가지가 모두 승인된 구직자의 인증 마크 신청을 처리합니다."
      />

      <SegmentedControl items={TABS} value={tab} onChange={setTab} />

      <div className="mt-5">
        {tab === 'certificates' && (
          <ReviewList<CertificateReviewItem>
            load={getAdminCertificates}
            approve={approveCertificate}
            reject={rejectCertificate}
            getId={(item) => item.certificateId}
            getStatus={(item) => item.adminReviewStatus}
            getTitle={(item) => `${item.memberName} · ${item.certificateName}`}
            getRejectReason={(item) => item.adminReviewReason}
            emptyText="해당 상태의 자격증이 없습니다."
            rejectDescription="반려 사유는 신청자에게 알림으로 전달됩니다."
            renderBody={(item) => (
              <>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-fg-muted sm:grid-cols-2">
                  <Row label="자격증 종류" value={certificateTypeLabel(item.certificateType)} />
                  <Row label="자격증 번호" value={item.certificateNumber ?? '-'} />
                  <Row label="파일 검증" value={item.fileVerificationStatus} />
                  <Row label="등록일" value={formatServerDateTime(item.createdAt)} />
                </dl>
                {item.downloadUrl ? (
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-deep underline underline-offset-4 hover:text-primary"
                  >
                    <FileText className="size-4" aria-hidden />
                    자격증 파일 보기
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-fg-subtle">첨부된 파일이 없습니다.</p>
                )}
              </>
            )}
          />
        )}

        {tab === 'careers' && (
          <ReviewList<CareerVerificationReviewItem>
            load={getAdminCareerVerifications}
            approve={approveCareerVerification}
            reject={rejectCareerVerification}
            getId={(item) => item.careerVerificationId}
            getStatus={(item) => item.status}
            getTitle={(item) => `${item.memberName} · ${item.organizationName}`}
            getRejectReason={(item) => item.rejectReason}
            emptyText="해당 상태의 경력 인증이 없습니다."
            rejectDescription="반려 사유는 신청자에게 알림으로 전달됩니다."
            renderBody={(item) => (
              <>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-fg-muted sm:grid-cols-2">
                  <Row label="담당 업무" value={item.roleTitle ?? '-'} />
                  <Row label="근무 기간" value={periodLabel(item.startDate, item.endDate)} />
                  <Row label="신청일" value={formatServerDateTime(item.createdAt)} />
                </dl>
                {item.description && (
                  <p className="mt-3 text-sm whitespace-pre-line text-fg">{item.description}</p>
                )}
                <p className="mt-3 text-sm text-fg-subtle">
                  경력은 증빙 파일 없이 신청자가 적은 내용만으로 판단합니다.
                </p>
              </>
            )}
          />
        )}

        {tab === 'badges' && (
          <ReviewList<BadgeRequestReviewItem>
            load={getAdminBadgeRequests}
            approve={approveBadgeRequest}
            reject={rejectBadgeRequest}
            getId={(item) => item.badgeRequestId}
            getStatus={(item) => item.status}
            getTitle={(item) => item.memberName}
            getRejectReason={(item) => item.rejectReason}
            emptyText="해당 상태의 마크 신청이 없습니다."
            rejectDescription="반려 사유는 신청자에게 알림으로 전달됩니다."
            renderBody={(item) => (
              <>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-fg-muted sm:grid-cols-2">
                  <Row label="신청일" value={formatServerDateTime(item.requestedAt)} />
                  <Row label="처리일" value={item.decidedAt ? formatServerDateTime(item.decidedAt) : '-'} />
                </dl>
                <p className="mt-3 text-sm text-fg-subtle">
                  승인하면 이 구직자의 인재정보에 인증 마크가 바로 표시됩니다.
                </p>
              </>
            )}
          />
        )}
      </div>
    </div>
  )
}

interface ReviewListProps<T> {
  load: (params: { status?: ReviewStatus; page?: number; size?: number }) => Promise<SpringPage<T>>
  approve: (id: number) => Promise<unknown>
  reject: (id: number, reason: string) => Promise<unknown>
  getId: (item: T) => number
  getStatus: (item: T) => ReviewStatus
  getTitle: (item: T) => string
  getRejectReason: (item: T) => string | null
  renderBody: (item: T) => ReactNode
  emptyText: string
  rejectDescription: string
}

/**
 * 심사 목록 공통 — 상태 탭 + 목록 + 승인/반려 + 페이지네이션.
 * 세 심사(자격증·경력·마크)가 응답 형태만 다르고 흐름이 같아 한 컴포넌트로 묶었다.
 */
function ReviewList<T>({
  load,
  approve,
  reject,
  getId,
  getStatus,
  getTitle,
  getRejectReason,
  renderBody,
  emptyText,
  rejectDescription,
}: ReviewListProps<T>) {
  const { toast } = useToast()
  const [status, setStatus] = useState<ReviewStatus | ''>('PENDING')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<T> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<T | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    load({ status: status || undefined, page: page - 1, size: PAGE_SIZE })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false))
  }, [load, status, page])

  useEffect(reload, [reload])

  const handleApprove = async (item: T) => {
    setProcessingId(getId(item))
    try {
      await approve(getId(item))
      toast({ title: '승인 처리했습니다.', description: '신청자에게 알림이 발송됩니다.' })
      reload()
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

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setProcessingId(getId(rejectTarget))
    try {
      await reject(getId(rejectTarget), rejectReason.trim())
      toast({ title: '반려 처리했습니다.', description: '신청자에게 알림이 발송됩니다.' })
      setRejectTarget(null)
      reload()
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
          <LoadFailed message={error} onRetry={reload} />
        ) : !data || data.content.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState title={emptyText} />
          </div>
        ) : (
          <>
            <AdminTotalCount count={data.totalElements} />

            <ul className="space-y-4">
              {data.content.map((item) => {
                const itemStatus = getStatus(item)
                const badge = STATUS_BADGE[itemStatus]
                const busy = processingId === getId(item)
                const reason = getRejectReason(item)
                return (
                  <li key={getId(item)} className="rounded-card border border-border bg-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-fg">{getTitle(item)}</h2>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>

                        {renderBody(item)}

                        {itemStatus === 'REJECTED' && reason && (
                          <p className="mt-3 text-sm text-danger">반려 사유: {reason}</p>
                        )}
                      </div>

                      {itemStatus === 'PENDING' && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              setRejectTarget(item)
                              setRejectReason('')
                            }}
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
        title="반려 처리"
        description={rejectTarget ? getTitle(rejectTarget) : undefined}
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
          maxLength={300}
          placeholder="반려 사유를 입력해 주세요."
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
        <p className="mt-2 text-sm text-fg-subtle">{rejectDescription}</p>
      </Modal>
    </div>
  )
}

/** 심사 항목 상세 한 줄 (AdminFacilities 의 dl 표기와 같은 형태) */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline text-fg-subtle">{label} </dt>
      <dd className="inline text-fg">{value}</dd>
    </div>
  )
}
