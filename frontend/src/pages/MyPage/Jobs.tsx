import { Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getMyJobPostings } from '@/api/job-postings'
import { jobCategoryLabel } from '@/data/labels'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { cn, formatNumber } from '@/lib/utils'
import { LoadFailed } from '@/pages/Support/shared'
import type { JobPostingSummaryResponse, PageResponse } from '@/types/api'

const PAGE_SIZE = 10

const PAY_LABEL: Record<JobPostingSummaryResponse['payType'], string> = {
  HOURLY: '시급',
  DAILY: '일급',
  MONTHLY: '월급',
}

const EMPTY_PAGE: PageResponse<JobPostingSummaryResponse> = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
}

/**
 * `/mypage/jobs` — 시설회원이 등록한 공고 현황(상태·지원자 수). 백엔드
 * `GET /api/job-postings/me` 는 `hasRole('FACILITY')` 라 그 외 역할(관리자 포함)은 호출하지 않는다.
 */
export function MyPageJobsPage() {
  const { user } = useApp()
  const canView = user?.role === 'FACILITY' || user?.role === 'ADMIN'
  const isFacility = user?.role === 'FACILITY'

  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useAsync(
    () => (isFacility ? getMyJobPostings(page - 1, PAGE_SIZE) : Promise.resolve(EMPTY_PAGE)),
    [isFacility, page],
  )

  if (!canView) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState title="시설회원 전용 화면입니다." description="등록한 공고는 시설회원만 확인할 수 있습니다." />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-fg">등록한 공고</h1>
        <Link to="/mypage/jobs/new" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
          공고 등록하기
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
            <EmptyState
              title="등록한 공고가 없습니다."
              description="첫 공고를 등록하고 구직자에게 노출해 보세요."
              action={
                <Link to="/mypage/jobs/new" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
                  공고 등록하기
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
              {data.content.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Badge variant={job.status === 'OPEN' ? 'new' : 'neutralOutline'}>
                        {job.status === 'OPEN' ? '모집중' : '마감'}
                      </Badge>
                      <Link to={`/jobs/${job.id}`} className="truncate text-base font-semibold text-fg hover:underline">
                        {job.title}
                      </Link>
                    </span>
                    <span className="mt-1 block text-sm text-fg-muted">
                      {jobCategoryLabel(job.jobType)} · {job.sido} {job.sigungu} · {PAY_LABEL[job.payType]}{' '}
                      {formatNumber(job.payAmount)}원
                    </span>
                  </div>
                  <Link
                    to={`/mypage/jobs/${job.id}/applicants`}
                    className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'shrink-0 gap-1.5')}
                  >
                    <Users className="size-4" aria-hidden />
                    지원자 {formatNumber(job.applicantCount)}명
                  </Link>
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
