import { Briefcase, Clock, Eye, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ScrapButton } from '@/components/common/scrap-button'
import { FacilityBadge } from '@/components/job/facility-badge'
import { JobBadge } from '@/components/job/job-badge'
import { buttonVariants } from '@/components/ui/button'
import { employmentTypeLabel, workScheduleLabel } from '@/data/labels'
import { cn, formatDotDate, formatNumber, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

/**
 * 공고 핵심 정보 (COMPONENT_RULES.md §22 Job Header)
 *
 * 시각적 우선순위: 공고 제목 > 시설명 > 급여 > 지역·근무 시간대 > 등록일
 * 시설명이 제목보다 커지지 않도록 시설명은 제목 위 보조 라인으로 둔다.
 * 상태 배지는 목록과 동일하게 5종을 모두 노출한다.
 */
export function JobDetailHeader({ job, className }: { job: Job; className?: string }) {
  return (
    <header className={cn('rounded-card border border-border bg-surface p-6 lg:p-8', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <JobBadge status={job.status} size="md" />
            <FacilityBadge type={job.facilityType} size="md" plain />
          </div>

          <p className="mt-4 text-base font-semibold text-primary-deep">{job.facilityName}</p>

          <h1 className="mt-1 text-3xl font-bold text-fg">{job.title}</h1>

          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-fg-muted">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">근무 지역</dt>
              <MapPin className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
              <dd>
                {job.region}
                {job.district && ` ${job.district}`}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">근무 시간대와 근무시간</dt>
              <Clock className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
              <dd className="tabular">
                {job.workSchedule ? `${workScheduleLabel(job.workSchedule)} · ` : ''}
                {job.workHours}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">고용형태</dt>
              <Briefcase className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
              <dd>{employmentTypeLabel(job.employmentType)}</dd>
            </div>
          </dl>

          <p className="mt-5 text-2xl font-bold text-fg tabular">
            {formatPay(job.payType, job.payAmount)}
          </p>

          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
            <span className="tabular">등록일 {formatDotDate(job.postedAt)}</span>
            <span className="flex items-center gap-1 tabular">
              <Eye className="size-4" aria-hidden />
              조회 {formatNumber(job.viewCount)}
            </span>
            <span className="flex items-center gap-1 tabular">
              <Users className="size-4" aria-hidden />
              지원 {job.applicantCount}명
            </span>
          </p>
        </div>

        {/* 핵심 액션 */}
        <div className="flex shrink-0 items-center gap-2">
          <ScrapButton showLabel label="관심공고" />
          <Link
            to={`/apply?jobId=${job.id}`}
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'px-8')}
          >
            지원하기
          </Link>
        </div>
      </div>
    </header>
  )
}
