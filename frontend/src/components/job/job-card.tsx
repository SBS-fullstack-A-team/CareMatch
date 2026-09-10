import { Building2, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isPromoted, JobBadge } from '@/components/job/job-badge'
import { MatchingReasonChips, MatchingScoreBadge } from '@/components/matching/matching-score'
import { jobCategoryLabel } from '@/data/labels'
import { cn, formatDotDate, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

/**
 * 맞춤 공고 카드 (DESIGN_SYSTEM.md §18)
 *
 * [매칭 92%] [지역 일치] [시간대 일치]   [스페셜]
 * 시설명 / 시설유형 / 직종
 * 지역
 * 근무형태 | 급여
 * 등록일
 *
 * 하트 스크랩 버튼·태그·그림자는 넣지 않는다.
 */
export function JobCard({ job, className }: { job: Job; className?: string }) {
  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/40',
        className,
      )}
    >
      <div className="flex min-h-16 items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {job.matching && <MatchingScoreBadge score={job.matching.score} />}
          {job.matching && <MatchingReasonChips reasons={job.matching.reasons} max={2} />}
        </div>
        {isPromoted(job.status) && <JobBadge status={job.status} />}
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-primary-light text-primary"
        >
          <Building2 className="size-6" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm text-fg-muted">{job.facilityName}</p>
          <p className="truncate text-sm text-fg-subtle">{job.facilityType}</p>
          <h3 className="mt-1 text-lg font-bold text-fg">
            <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0">
              {jobCategoryLabel(job.category)}
            </Link>
          </h3>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-base text-fg-muted">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">근무 지역</dt>
          <MapPin className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
          <dd className="truncate">{job.region}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">근무 형태와 급여</dt>
          <Clock className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
          <dd className="flex flex-wrap items-center gap-x-2">
            <span className="whitespace-nowrap">{job.workType}</span>
            <span aria-hidden className="text-border-strong">
              |
            </span>
            <span className="font-bold whitespace-nowrap text-fg tabular">
              {formatPay(job.payType, job.payAmount)}
            </span>
          </dd>
        </div>
      </dl>

      <p className="mt-auto pt-5 text-xs text-fg-subtle tabular">
        등록일 {formatDotDate(job.postedAt)}
      </p>
    </article>
  )
}
