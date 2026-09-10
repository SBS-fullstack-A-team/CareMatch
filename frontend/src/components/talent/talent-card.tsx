import { UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { jobCategoryLabel } from '@/data/labels'
import { cn, formatDotDate, maskName } from '@/lib/utils'
import type { Talent } from '@/types'

/**
 * 최신 인재정보 카드 (DESIGN_SYSTEM.md §21)
 * 매칭 점수 / 급여 / 스크랩 버튼 / 태그는 노출하지 않는다.
 * 이름은 마스킹해서 표시한다.
 */
export function TalentCard({ talent, className }: { talent: Talent; className?: string }) {
  return (
    <article
      className={cn(
        'group relative flex gap-4 rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/40',
        className,
      )}
    >
      {talent.photoUrl ? (
        <img
          src={talent.photoUrl}
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-full bg-surface-sunken text-fg-subtle"
        >
          <UserRound className="size-8" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold text-fg">
          <Link to={`/talents/${talent.id}`} className="after:absolute after:inset-0">
            {maskName(talent.name)}
          </Link>
          <span className="ml-1.5 text-sm font-normal text-fg-muted">
            ({talent.gender} · {talent.age}세)
          </span>
        </h3>

        <p className="mt-1 text-base text-fg">
          <span className="font-bold">{jobCategoryLabel(talent.category)}</span>
          <span className="ml-1 text-fg-muted">희망</span>
        </p>

        <p className="mt-2 truncate text-base text-fg-muted">{talent.regions.join(' · ')}</p>

        <dl className="mt-2 space-y-1 text-base">
          <div className="flex gap-2">
            <dt className="shrink-0 text-fg-subtle">자격증</dt>
            <dd className="truncate text-fg-muted">{talent.certificates.join(', ')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-fg-subtle">갱신일</dt>
            <dd className="text-fg-muted tabular">{formatDotDate(talent.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}
