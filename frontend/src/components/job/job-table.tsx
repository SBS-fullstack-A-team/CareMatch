import { Link } from 'react-router-dom'
import { JobBadge } from '@/components/job/job-badge'
import { jobCategoryLabel, workScheduleLabel } from '@/data/labels'
import { formatDotDate, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

/**
 * 최신 구인공고 TABLE (DESIGN_SYSTEM.md §20)
 * 상태 배지는 5종을 모두 노출한다. (§14 화면별 예외)
 * 모바일에서는 가로 스크롤 대신 행을 세로로 재배치한다. (§28, §38)
 */
export function JobTable({ jobs, className }: { jobs: Job[]; className?: string }) {
  return (
    <div className={className}>
      {/* Desktop / Tablet */}
      <table className="hidden w-full border-collapse text-left lg:table">
        <thead>
          <tr className="bg-surface-sunken text-sm text-fg-muted">
            <th scope="col" className="w-[96px] rounded-l-[8px] px-4 py-3 font-medium">
              상태
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              시설명
            </th>
            <th scope="col" className="w-[104px] px-4 py-3 font-medium">
              직종
            </th>
            <th scope="col" className="w-[140px] px-4 py-3 font-medium">
              지역
            </th>
            <th scope="col" className="w-[170px] px-4 py-3 font-medium">
              근무 시간대
            </th>
            <th scope="col" className="w-[150px] px-4 py-3 font-medium">
              급여
            </th>
            <th scope="col" className="w-[104px] rounded-r-[8px] px-4 py-3 font-medium">
              등록일
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-border transition-colors hover:bg-bg">
              <td className="px-4 py-4">
                <JobBadge status={job.status} />
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-base text-fg hover:text-primary-deep hover:underline"
                >
                  {job.facilityName}
                </Link>
              </td>
              <td className="px-4 py-4 text-base text-fg-muted">{jobCategoryLabel(job.category)}</td>
              <td className="px-4 py-4 text-base text-fg-muted">{job.region}</td>
              <td className="px-4 py-4 text-base text-fg-muted tabular">
                {job.workSchedule ? `${workScheduleLabel(job.workSchedule)} ` : ''}({job.workHours})
              </td>
              <td className="px-4 py-4 text-base font-semibold text-fg tabular">
                {formatPay(job.payType, job.payAmount)}
              </td>
              <td className="px-4 py-4 text-xs text-fg-subtle tabular">
                {formatDotDate(job.postedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile */}
      <ul className="overflow-hidden rounded-card border border-border bg-surface lg:hidden">
        {jobs.map((job) => (
          <li key={job.id} className="border-b border-border last:border-b-0">
            <Link to={`/jobs/${job.id}`} className="block px-4 py-4">
              <div className="flex items-center gap-2">
                <JobBadge status={job.status} />
                <span className="truncate text-base text-fg">{job.facilityName}</span>
              </div>
              <p className="mt-2 text-base text-fg-muted">
                {jobCategoryLabel(job.category)} · {job.region}
              </p>
              <p className="mt-1 text-base text-fg-muted tabular">
                {job.workSchedule ? `${workScheduleLabel(job.workSchedule)} ` : ''}({job.workHours})
              </p>
              <p className="mt-2 flex items-center justify-between gap-2">
                <span className="text-base font-bold text-fg tabular">
                  {formatPay(job.payType, job.payAmount)}
                </span>
                <span className="text-xs text-fg-subtle tabular">
                  {formatDotDate(job.postedAt)}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
