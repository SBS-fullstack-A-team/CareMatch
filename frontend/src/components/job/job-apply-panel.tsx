import { Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

/**
 * 우측 sticky 지원 패널 (COMPONENT_RULES.md §21, §22)
 * 스크롤 중에도 급여·근무 조건을 보면서 바로 지원할 수 있게 하는 것이 목적이다.
 *
 * 온라인 지원 기능은 아직 없어 구직신청 라우트(/apply)로 연결만 해 둔다.
 * 전화 지원은 공고에 담당자 연락처가 있을 때만 노출한다.
 */
export function JobApplyPanel({ job, className }: { job: Job; className?: string }) {
  return (
    <div className={cn('rounded-card border border-border bg-surface p-6', className)}>
      <h2 className="text-lg font-bold text-fg">지원하기</h2>

      <p className="mt-3 text-2xl font-bold text-fg tabular">
        {formatPay(job.payType, job.payAmount)}
      </p>

      <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-base">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-fg-muted">근무</dt>
          <dd className="min-w-0 flex-1 text-fg tabular">
            {job.workType} · {job.workHours}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-fg-muted">지역</dt>
          <dd className="min-w-0 flex-1 text-fg">
            {job.region}
            {job.district && ` ${job.district}`}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-fg-muted">고용형태</dt>
          <dd className="min-w-0 flex-1 text-fg">{job.employmentType}</dd>
        </div>
      </dl>

      <Link
        to={`/apply?jobId=${job.id}`}
        className={cn(buttonVariants({ variant: 'primary', block: true }), 'mt-5')}
      >
        온라인으로 지원하기
      </Link>

      {job.managerPhone && (
        <a
          href={`tel:${job.managerPhone.replaceAll('-', '')}`}
          className={cn(buttonVariants({ variant: 'secondary', block: true }), 'mt-2')}
        >
          <Phone aria-hidden />
          {job.managerPhone}
        </a>
      )}
    </div>
  )
}
