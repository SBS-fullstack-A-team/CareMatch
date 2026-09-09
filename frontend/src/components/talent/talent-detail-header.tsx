import { Award, MapPin, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatDotDate, maskName } from '@/lib/utils'
import type { Talent } from '@/types'

/**
 * 인재 프로필 핵심 영역.
 *
 * 시설 담당자가 "누구이고 어떤 일을 원하는지"를 가장 먼저 파악하는 영역이라
 * 마스킹된 이름 → 희망직종 → 지역·경력 순으로 시각적 우선순위를 둔다.
 * 이름은 기존 maskName() 정책 그대로다. (DESIGN_SYSTEM.md §21)
 *
 * 프로필 사진이 없어도 동일한 크기의 원형 placeholder 를 유지한다. (§32)
 */
export function TalentDetailHeader({
  talent,
  className,
}: {
  talent: Talent
  className?: string
}) {
  return (
    <header
      className={cn('rounded-card border border-border bg-surface p-6 lg:p-8', className)}
    >
      <div className="flex flex-wrap items-start gap-6">
        {talent.photoUrl ? (
          <img
            src={talent.photoUrl}
            alt=""
            width={96}
            height={96}
            className="size-24 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-24 shrink-0 place-items-center rounded-full bg-surface-sunken text-fg-subtle"
          >
            <UserRound className="size-12" strokeWidth={1.5} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-3xl font-bold text-fg">{maskName(talent.name)}</h1>
            <p className="text-base text-fg-muted">
              {talent.gender} · {talent.age}세
            </p>
            {talent.availableNow && <Badge variant="normal">즉시 근무 가능</Badge>}
          </div>

          <p className="mt-3 text-xl">
            <span className="font-bold text-primary-deep">{talent.category}</span>
            <span className="ml-1.5 text-fg-muted">희망</span>
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-fg-muted">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">희망 지역</dt>
              <MapPin className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
              <dd>{talent.regions.join(' · ')}</dd>
            </div>

            {talent.careerLabel && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">경력</dt>
                <Award className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
                <dd className="text-fg">{talent.careerLabel}</dd>
              </div>
            )}
          </dl>

          <p className="mt-4 text-xs text-fg-subtle tabular">
            최근 업데이트 {formatDotDate(talent.updatedAt)}
          </p>
        </div>
      </div>
    </header>
  )
}
