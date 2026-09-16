import { Building2, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { JobBadge } from '@/components/job/job-badge'
import { workScheduleLabel } from '@/data/labels'
import { cn, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

/**
 * 스페셜 채용정보 카드 (DESIGN_SYSTEM.md §19)
 * 좌측: 상태 배지 / 시설명 / 공고 제목 / 지역 / 근무 시간대·급여
 * 우측: 시설 사진(90×70) + 짧은 홍보 문구
 *
 * 실제 사진이 없어도 동일한 크기의 영역을 유지한다. (§32)
 */
export function SpecialJobCard({ job, className }: { job: Job; className?: string }) {
  return (
    <article
      className={cn(
        // 모바일에서는 세로로 쌓는다 — 고정폭 사진 영역이 좌측 정보 영역 폭을
        // 잠식해 급여 등 nowrap 텍스트가 카드 밖으로 넘치는 것을 막기 위함.
        // sm 이상에서만 §19 목업대로 좌우 배치한다.
        'group relative flex flex-col gap-4 rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/40 sm:flex-row',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <JobBadge status="special" />

        <p className="mt-3 truncate text-sm text-primary-deep">{job.facilityName}</p>

        <h3 className="mt-1 text-xl font-bold break-words text-fg">
          <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0">
            {job.title}
          </Link>
        </h3>

        <dl className="mt-3 space-y-2 text-base text-fg-muted">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">근무 지역</dt>
            <MapPin className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
            <dd className="truncate">{job.region}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">근무 시간대와 급여</dt>
            <Clock className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
            <dd className="flex flex-wrap items-center gap-x-2">
              <span className="whitespace-nowrap">{workScheduleLabel(job.workSchedule)}</span>
              <span aria-hidden className="text-border-strong">
                |
              </span>
              <span className="font-bold whitespace-nowrap text-fg tabular">
                {formatPay(job.payType, job.payAmount)}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:w-[104px] sm:flex-col sm:gap-2 lg:w-[128px]">
        {job.imageUrl ? (
          <img
            src={job.imageUrl}
            alt={`${job.facilityName} 시설 사진`}
            width={90}
            height={70}
            className="h-[70px] w-[90px] shrink-0 rounded-[8px] object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-[70px] w-[90px] shrink-0 place-items-center rounded-[8px] bg-primary-light text-primary"
          >
            <Building2 className="size-6" />
          </span>
        )}

        {job.catchphrase && (
          <p className="min-w-0 text-sm leading-snug break-words text-fg-muted sm:text-center">
            {job.catchphrase}
          </p>
        )}
      </div>
    </article>
  )
}
