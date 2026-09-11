import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { cancelApplication, getMyApplications } from '@/api/applications'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { cn, formatNumber } from '@/lib/utils'
import { formatServerDate, LoadFailed } from '@/pages/Support/shared'
import type { ApplicationStatus, MyApplicationResponse, PageResponse } from '@/types/api'

const PAGE_SIZE = 10

const STATUS_FILTERS: { value: ApplicationStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'APPLIED', label: '지원중' },
  { value: 'ACCEPTED', label: '합격' },
  { value: 'REJECTED', label: '불합격' },
  { value: 'CANCELED', label: '취소' },
]

const STATUS_BADGE: Record<ApplicationStatus, { label: string; variant: BadgeProps['variant'] }> = {
  APPLIED: { label: '지원중', variant: 'normal' },
  ACCEPTED: { label: '합격', variant: 'new' },
  REJECTED: { label: '불합격', variant: 'closing' },
  CANCELED: { label: '취소', variant: 'neutralOutline' },
}

const EMPTY_PAGE: PageResponse<MyApplicationResponse> = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
}

/** `/mypage/applications` — 구직자 전용. 백엔드가 `hasRole('JOBSEEKER')` 로 강제한다. */
export function MyPageApplicationsPage() {
  const { user } = useApp()
  const isJobSeeker = user?.role === 'JOBSEEKER'

  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  const { data, loading, error, reload } = useAsync(
    () =>
      isJobSeeker
        ? getMyApplications(status === 'ALL' ? undefined : status, page - 1, PAGE_SIZE)
        : Promise.resolve(EMPTY_PAGE),
    [isJobSeeker, status, page],
  )

  if (!isJobSeeker) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          title="구직자 전용 화면입니다."
          description="공고 지원 현황은 구직회원만 확인할 수 있습니다."
        />
      </div>
    )
  }

  async function handleCancel(applicationId: number) {
    setCancelingId(applicationId)
    try {
      await cancelApplication(applicationId)
      reload()
    } catch {
      // 실패해도 목록은 그대로 둔다 — 사용자가 다시 시도할 수 있다
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-fg">지원 현황</h1>

      <div className="mt-4 overflow-x-auto">
        <SegmentedControl
          items={STATUS_FILTERS}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
        />
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
            <EmptyState
              title="지원 내역이 없습니다."
              description="마음에 드는 공고에 지원해보세요."
              action={
                <Link to="/jobs" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
                  구인공고 보러가기
                </Link>
              }
            />
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
              {data.content.map((item) => (
                <li
                  key={item.applicationId}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0"
                >
                  <Link to={`/jobs/${item.jobPostingId}`} className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Badge variant={STATUS_BADGE[item.status].variant}>
                        {STATUS_BADGE[item.status].label}
                      </Badge>
                      <span className="truncate text-base font-semibold text-fg">{item.title}</span>
                    </span>
                    <span className="mt-1 block text-sm text-fg-muted">
                      {item.facilityName} · {item.sido} {item.sigungu} · 지원일{' '}
                      {formatServerDate(item.appliedAt)}
                    </span>
                  </Link>
                  {item.status === 'APPLIED' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(item.applicationId)}
                      disabled={cancelingId === item.applicationId}
                      className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'shrink-0')}
                    >
                      {cancelingId === item.applicationId ? '취소 중…' : '지원 취소'}
                    </button>
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
