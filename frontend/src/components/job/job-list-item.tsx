import { Clock, Eye, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FacilityBadge } from '@/components/job/facility-badge'
import { JobBadge } from '@/components/job/job-badge'
import { MatchingReasonChips, MatchingScoreBadge } from '@/components/matching/matching-score'
import { ScrapButton } from '@/components/common/scrap-button'
import { Tag } from '@/components/ui/tag'
import { jobCategoryLabel, workScheduleLabel } from '@/data/labels'
import { cn, formatDotDate, formatNumber, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

/**
 * 목록형 공고 행 (COMPONENT_RULES.md §12)
 * 구인공고 목록처럼 여러 공고를 나란히 비교하는 화면에서 사용한다.
 *
 * 정보 우선순위: 시설명 + 직종 > 급여 > 지역 + 근무형태 > 근무시간 > 등록일 > 상태
 * 카드가 아니라 행으로 쌓이므로 화면 전체가 카드로만 채워지지 않는다.
 *
 * 상태 배지는 메인 TABLE 과 마찬가지로 5종을 모두 노출한다. 목록에서는 상태가
 * 비교 기준의 하나이므로 일반 공고만 배지가 비어 보이지 않도록 한다. (§14 화면별 예외)
 */
export function JobListItem({
  job,
  showMatching = true,
  className,
}: {
  job: Job
  showMatching?: boolean
  className?: string
}) {
  const hasMatching = showMatching && job.matching

  return (
    <article
      className={cn(
        'group relative bg-surface px-5 py-5 transition-colors hover:bg-primary-light/40 sm:px-6',
        className,
      )}
    >
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <JobBadge status={job.status} />
            <FacilityBadge type={job.facilityType} plain />
          </div>

          <h3 className="mt-2.5 text-xl font-bold text-fg">
            <Link to={`/jobs/${job.id}`} className="line-clamp-2-ko after:absolute after:inset-0">
              {job.facilityName}
            </Link>
          </h3>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-base">
            <span className="font-semibold text-primary-deep">{jobCategoryLabel(job.category)}</span>
            <span aria-hidden className="text-border-strong">
              |
            </span>
            <span className="text-fg-muted">{job.employmentType}</span>
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-base text-fg-muted">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">근무 지역</dt>
              <MapPin className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
              <dd>
                {job.region}
                {job.district && ` ${job.district}`}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">근무형태와 근무시간</dt>
              <Clock className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
              <dd className="tabular">
                {job.workSchedule ? `${workScheduleLabel(job.workSchedule)} · ` : ''}
                {job.workHours}
              </dd>
            </div>
          </dl>

          {job.tags && job.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {job.tags.slice(0, 4).map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
          )}

          {hasMatching && (
            <MatchingReasonChips reasons={job.matching!.reasons} className="mt-3" max={3} />
          )}

          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
            <span className="tabular">등록 {formatDotDate(job.postedAt)}</span>
            <span className="flex items-center gap-1 tabular">
              <Eye className="size-4" aria-hidden />
              {formatNumber(job.viewCount)}
            </span>
            <span className="flex items-center gap-1 tabular">
              <Users className="size-4" aria-hidden />
              지원 {job.applicantCount}명
            </span>
          </p>
        </div>

        <div className="flex w-[176px] shrink-0 flex-col items-end justify-between gap-3 max-sm:hidden">
          <ScrapButton />
          <div className="text-right">
            {hasMatching && (
              <MatchingScoreBadge score={job.matching!.score} size="md" className="mb-2" />
            )}
            <p className="text-xl font-bold text-fg tabular">
              {formatPay(job.payType, job.payAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* 모바일: 급여를 하단으로 재배치 */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5 sm:hidden">
        <p className="text-xl font-bold text-fg tabular">
          {formatPay(job.payType, job.payAmount)}
        </p>
        <ScrapButton size="md" />
      </div>
    </article>
  )
}
