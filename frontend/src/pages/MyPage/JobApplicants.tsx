import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { getApplicantsOfPosting, updateApplicationStatus } from '@/api/applications'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { formatServerDateTime, LoadFailed } from '@/pages/Support/shared'
import type { ApplicantResponse, ApplicationStatus, PageResponse } from '@/types/api'

const PAGE_SIZE = 20

const STATUS_BADGE: Record<ApplicationStatus, { label: string; variant: BadgeProps['variant'] }> = {
  APPLIED: { label: '지원중', variant: 'normal' },
  ACCEPTED: { label: '합격', variant: 'new' },
  REJECTED: { label: '불합격', variant: 'closing' },
  CANCELED: { label: '취소', variant: 'neutralOutline' },
}

const EMPTY_PAGE: PageResponse<ApplicantResponse> = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
}

/** `/mypage/jobs/:jobPostingId/applicants` — 시설회원 전용, 특정 공고의 지원자 목록 + 수락/반려. */
export function MyPageJobApplicantsPage() {
  const { jobPostingId } = useParams()
  const numericId = jobPostingId && /^\d+$/.test(jobPostingId) ? Number(jobPostingId) : null
  const { user } = useApp()
  const { toast } = useToast()
  const isFacility = user?.role === 'FACILITY'

  const [page, setPage] = useState(1)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const { data, loading, error, reload } = useAsync(
    () =>
      isFacility && numericId != null
        ? getApplicantsOfPosting(numericId, page - 1, PAGE_SIZE)
        : Promise.resolve(EMPTY_PAGE),
    [isFacility, numericId, page],
  )

  if (!isFacility) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState title="시설회원 전용 화면입니다." description="지원자 목록은 시설회원만 확인할 수 있습니다." />
      </div>
    )
  }

  if (numericId == null) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState title="잘못된 접근입니다." description="공고 목록에서 다시 시도해 주세요." />
      </div>
    )
  }

  async function handleDecision(applicationId: number, status: 'ACCEPTED' | 'REJECTED') {
    setProcessingId(applicationId)
    try {
      await updateApplicationStatus(applicationId, status)
      toast({ title: status === 'ACCEPTED' ? '지원자를 합격 처리했습니다.' : '지원자를 반려했습니다.' })
      reload()
    } catch (err) {
      toast({
        variant: 'error',
        title: '처리에 실패했습니다.',
        description: err instanceof ApiError ? err.message : undefined,
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-fg">지원자 목록</h1>
        <Link to="/mypage/jobs" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
          공고 목록으로
        </Link>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="overflow-hidden rounded-card border border-border">
            <LoadingState rows={4} />
          </div>
        ) : error ? (
          <LoadFailed message={error} onRetry={reload} />
        ) : !data || data.content.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState title="아직 지원자가 없습니다." description="공고가 노출되면 지원자가 이 곳에 표시됩니다." />
          </div>
        ) : (
          <>
            <ul className="overflow-hidden rounded-card border border-border bg-surface">
              {data.content.map((applicant) => (
                <li
                  key={applicant.applicationId}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Badge variant={STATUS_BADGE[applicant.status].variant}>
                        {STATUS_BADGE[applicant.status].label}
                      </Badge>
                      <span className="truncate text-base font-semibold text-fg">{applicant.applicantName}</span>
                      {applicant.matchingScore != null && (
                        <span className="shrink-0 text-sm text-fg-subtle tabular">
                          매칭 {applicant.matchingScore}점
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-fg-muted">
                      {applicant.employmentStatus === 'EMPLOYED' ? '재직 중' : '구직 중'}
                      {applicant.certificateNames.length > 0 && ` · ${applicant.certificateNames.join(', ')}`}
                      {' · 지원일 '}
                      {formatServerDateTime(applicant.appliedAt)}
                    </span>
                    {applicant.message && (
                      <p className="mt-2 rounded-input bg-surface-sunken px-3 py-2 text-sm text-fg">
                        {applicant.message}
                      </p>
                    )}
                  </div>
                  {applicant.status === 'APPLIED' && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={processingId === applicant.applicationId}
                        onClick={() => handleDecision(applicant.applicationId, 'REJECTED')}
                      >
                        반려
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={processingId === applicant.applicationId}
                        onClick={() => handleDecision(applicant.applicationId, 'ACCEPTED')}
                      >
                        {processingId === applicant.applicationId ? '처리 중…' : '합격'}
                      </Button>
                    </div>
                  )}
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
