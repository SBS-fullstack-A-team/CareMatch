import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { buttonVariants } from '@/components/ui/button'
import { getMyScraps, removeScrap } from '@/api/scraps'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { cn, formatNumber } from '@/lib/utils'
import { LoadFailed } from '@/pages/Support/shared'
import type { JobPostingSummary, PageResponse } from '@/types/api'

const PAGE_SIZE = 10

const PAY_LABEL: Record<JobPostingSummary['payType'], string> = {
  HOURLY: '시급',
  DAILY: '일급',
  MONTHLY: '월급',
}

const EMPTY_PAGE: PageResponse<JobPostingSummary> = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
}

/**
 * `/mypage/scraps` — 구직자의 관심 공고. 백엔드 스크랩 API 는 역할 제한이 없지만,
 * "관심 인재" 개념(시설회원용)은 서버에 없어 시설회원은 안내만 하고 목록을 부르지 않는다.
 */
export function MyPageScrapsPage() {
  const { user } = useApp()
  const isJobSeeker = user?.role === 'JOBSEEKER'

  const [page, setPage] = useState(1)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const { data, loading, error, reload } = useAsync(
    () => (isJobSeeker ? getMyScraps(page - 1, PAGE_SIZE) : Promise.resolve(EMPTY_PAGE)),
    [isJobSeeker, page],
  )

  if (!isJobSeeker) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          title="관심 인재 기능은 준비 중입니다."
          description="시설회원의 인재 스크랩 기능은 다음 단계에서 제공될 예정입니다."
        />
      </div>
    )
  }

  async function handleRemove(jobPostingId: number) {
    setRemovingId(jobPostingId)
    try {
      await removeScrap(jobPostingId)
      reload()
    } catch {
      // 실패해도 목록은 그대로 둔다 — 사용자가 다시 시도할 수 있다
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-fg">관심 공고</h1>

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
              title="관심 등록한 공고가 없습니다."
              description="마음에 드는 공고에 하트를 눌러 모아보세요."
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
              {data.content.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0"
                >
                  <Link to={`/jobs/${job.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-fg">{job.title}</span>
                    <span className="mt-1 block text-sm text-fg-muted">
                      {job.facilityName} · {job.sido} {job.sigungu}
                      {job.payAmount != null && ` · ${PAY_LABEL[job.payType]} ${formatNumber(job.payAmount)}원`}
                      {job.status === 'CLOSED' && ' · 마감'}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(job.id)}
                    disabled={removingId === job.id}
                    className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'shrink-0 gap-1.5')}
                  >
                    <Heart className="size-4" fill="currentColor" aria-hidden />
                    {removingId === job.id ? '해제 중…' : '해제'}
                  </button>
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
