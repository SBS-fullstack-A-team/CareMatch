import { Award, BriefcaseBusiness, Building2, Check, Clock, MapPin, Wallet, X } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'
import type { MatchingReason, MatchingReasonKind } from '@/types'

const REASON_ICON: Record<MatchingReasonKind, ComponentType<{ className?: string }>> = {
  region: MapPin,
  schedule: Clock,
  pay: Wallet,
  category: BriefcaseBusiness,
  facilityType: Building2,
  career: Award,
}

export interface MatchingScoreProps {
  score: number
  /** 매칭 사유. 숫자만 보여주지 않고 사유를 함께 노출한다. */
  reasons?: MatchingReason[]
  /** card: 카드·목록용 / detail: 상세 화면용 패널 */
  variant?: 'card' | 'detail'
  /** card variant 에서 노출할 사유 개수 */
  maxReasons?: number
  className?: string
}

/**
 * 케어매치의 매칭 점수는 항상 이 컴포넌트로만 그린다. (DESIGN_SYSTEM.md §15)
 * 점수에 따라 색상을 다르게 하지 않으며, 모든 점수가 동일한 Primary pill 이다.
 * pill 형태는 §8 의 명시적 예외다.
 */
export function MatchingScore({
  score,
  reasons,
  variant = 'card',
  maxReasons = 2,
  className,
}: MatchingScoreProps) {
  if (variant === 'detail') {
    return <MatchingScorePanel score={score} reasons={reasons ?? []} className={className} />
  }

  if (!reasons || reasons.length === 0) {
    return <MatchingScoreBadge score={score} className={className} />
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <MatchingScoreBadge score={score} />
      <MatchingReasonChips reasons={reasons} max={maxReasons} />
    </div>
  )
}

/** 점수 pill 단독 */
export function MatchingScoreBadge({
  score,
  size = 'sm',
  className,
}: {
  score: number
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary font-bold whitespace-nowrap text-white tabular',
        size === 'md' ? 'h-9 px-4 text-base' : 'h-7 px-3 text-sm',
        className,
      )}
    >
      매칭 {score}%
    </span>
  )
}

/** 매칭 사유 칩 — Primary Light 배경의 짧은 라벨 */
export function MatchingReasonChips({
  reasons,
  max = 2,
  className,
}: {
  reasons: MatchingReason[]
  max?: number
  className?: string
}) {
  const matched = reasons.filter((reason) => reason.matched).slice(0, max)
  if (matched.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {matched.map((reason) => (
        <li
          key={reason.kind}
          className="inline-flex h-7 items-center rounded-full bg-primary-light px-2.5 text-sm font-medium whitespace-nowrap text-primary-deep"
        >
          {reason.label}
        </li>
      ))}
    </ul>
  )
}

/** 상세 화면용 패널. 점수 + 게이지 + 충족/미충족 사유. */
function MatchingScorePanel({
  score,
  reasons,
  className,
}: {
  score: number
  reasons: MatchingReason[]
  className?: string
}) {
  return (
    <section
      className={cn('rounded-card border border-primary/35 bg-primary-light/70 p-6', className)}
      aria-label="매칭 점수"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-bold text-fg">나와의 매칭 점수</h3>
        <span className="text-sm text-fg-muted">희망조건 기준</span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <strong className="text-4xl leading-none font-bold text-primary-deep tabular">
          {score}
        </strong>
        <span className="text-xl font-bold text-primary-deep">%</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>

      {reasons.length > 0 && (
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {reasons.map((reason) => {
            const Icon = REASON_ICON[reason.kind]
            return (
              <li key={reason.kind} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                    reason.matched ? 'bg-primary text-white' : 'bg-border text-fg-muted',
                  )}
                  aria-hidden
                >
                  {reason.matched ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <X className="size-3.5" strokeWidth={3} />
                  )}
                </span>
                <span className={cn('text-base', reason.matched ? 'text-fg' : 'text-fg-muted')}>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Icon className="size-4" aria-hidden />
                    {reason.label}
                  </span>
                  {reason.detail && <span className="ml-1.5 text-fg-muted">{reason.detail}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
