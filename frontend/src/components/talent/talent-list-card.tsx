import { Award, Clock, MapPin, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import { jobCategoryLabel, workScheduleLabel } from '@/data/labels'
import { cn, formatDotDate, maskName } from '@/lib/utils'
import type { Talent } from '@/types'

/**
 * 인재정보 목록 카드.
 *
 * 메인의 TalentCard 는 요약·홍보 목적이라 정보가 고정되어 있고(DESIGN_SYSTEM.md §21),
 * 목록은 여러 인재를 비교·탐색하는 화면이라 근무형태·경력이 더 필요해 별도 컴포넌트로 둔다.
 * 카드 스타일(border 기반 white surface / radius 10 / 64px 원형 프로필)은 그대로 계승한다.
 *
 * 이름은 maskName() 으로 마스킹한다. (DESIGN_SYSTEM.md §21)
 */
export function TalentListCard({ talent, className }: { talent: Talent; className?: string }) {
  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/40',
        className,
      )}
    >
      {/* 기본 정보 */}
      <div className="flex items-start gap-3.5">
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
          <h3 className="truncate text-lg font-bold text-fg">{maskName(talent.name)}</h3>
          <p className="mt-0.5 text-sm text-fg-muted">
            {talent.gender} · {talent.age}세
          </p>
          {talent.availableNow && (
            <Badge variant="normal" className="mt-1.5">
              즉시 근무 가능
            </Badge>
          )}
        </div>
      </div>

      {/* 희망 조건 */}
      <p className="mt-4 text-base">
        <span className="font-bold text-primary-deep">{jobCategoryLabel(talent.category)}</span>
        <span className="ml-1 text-fg-muted">희망</span>
      </p>

      <dl className="mt-2.5 space-y-2 text-base text-fg-muted">
        <div className="flex items-start gap-1.5">
          <dt className="sr-only">희망 지역</dt>
          <MapPin className="mt-[3px] size-[18px] shrink-0 text-fg-subtle" aria-hidden />
          <dd className="min-w-0">{talent.regions.join(' · ')}</dd>
        </div>

        {talent.workSchedule && (
          <div className="flex items-start gap-1.5">
            <dt className="sr-only">희망 근무 시간대</dt>
            <Clock className="mt-[3px] size-[18px] shrink-0 text-fg-subtle" aria-hidden />
            <dd className="min-w-0">
              <span className="text-fg">{workScheduleLabel(talent.workSchedule)} 근무 희망</span>
              {talent.preferredHours && (
                <span className="block text-sm text-fg-subtle">{talent.preferredHours}</span>
              )}
            </dd>
          </div>
        )}

        {talent.careerLabel && (
          <div className="flex items-start gap-1.5">
            <dt className="sr-only">경력</dt>
            <Award className="mt-[3px] size-[18px] shrink-0 text-fg-subtle" aria-hidden />
            <dd className="min-w-0 text-fg">{talent.careerLabel}</dd>
          </div>
        )}
      </dl>

      {/* 자격증 */}
      {talent.certificates.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {talent.certificates.map((certificate) => (
            <li key={certificate}>
              <Tag>{certificate}</Tag>
            </li>
          ))}
        </ul>
      )}

      {/* 수정일 + 프로필 보기 — mt-auto 로 카드 높이가 달라도 하단에 정렬된다 */}
      <p className="mt-auto pt-4 text-xs text-fg-subtle tabular">
        프로필 수정 {formatDotDate(talent.updatedAt)}
      </p>

      <Link
        to={`/talents/${talent.id}`}
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'sm', block: true }),
          'mt-3 after:absolute after:inset-0',
        )}
      >
        프로필 보기
      </Link>
    </article>
  )
}
