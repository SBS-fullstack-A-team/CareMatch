import { Award, ClipboardList, FileText, Info, Phone, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DetailRow, DetailSection } from '@/components/common/detail-section'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { SectionHeader } from '@/components/common/section-header'
import { TalentDetailHeader } from '@/components/talent/talent-detail-header'
import { TalentListCard } from '@/components/talent/talent-list-card'
import { Button, buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Tag } from '@/components/ui/tag'
import { getTalent, getTalents, unlockContact } from '@/api/jobseekers'
import { certificateTypeLabel, jobCategoryLabel, workScheduleLabel } from '@/data/labels'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { detailToTalent, summaryToTalent } from '@/lib/talent-adapter'
import { ApiError } from '@/lib/api-client'
import { cn, formatNumber, formatPay } from '@/lib/utils'
import type { Talent } from '@/types'

/**
 * 인재정보 상세 (COMPONENT_RULES.md §15 / DESIGN_SYSTEM.md §6)
 *
 * Breadcrumb → 프로필 핵심 → (본문) 희망 근무조건·경력/자격·자기소개 + (우측) 연락처 열람/이용 안내
 * → 다른 인재정보
 *
 * `GET /api/jobseekers/{id}` 실 데이터. 데이터가 없는 항목은 행/섹션 자체를 렌더링하지 않는다.
 */
export function TalentDetailPage() {
  const { talentId } = useParams()
  const numericId = talentId && /^\d+$/.test(talentId) ? Number(talentId) : null

  const { data: detail, loading, error, reload } = useAsync(
    () => (numericId != null ? getTalent(numericId) : Promise.resolve(null)),
    [numericId],
  )

  const talent = detail ? detailToTalent(detail) : null

  const { data: others } = useAsync(
    () => (talent?.category ? getTalents({ desiredJobTypes: [talent.category], size: 4 }) : Promise.resolve(null)),
    [talent?.category, talent?.id],
  )
  const otherTalents = (others?.content ?? [])
    .map(summaryToTalent)
    .filter((other) => other.id !== talent?.id)
    .slice(0, 3)

  if (numericId == null || (!loading && (error || !talent))) {
    return <TalentNotFound description={error ?? undefined} />
  }
  if (loading || !talent) {
    return (
      <div className="container-page py-10">
        <LoadingState rows={4} />
      </div>
    )
  }

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb
        items={[
          { label: '홈', to: '/' },
          { label: '인재정보', to: '/talents' },
          { label: '인재 상세' },
        ]}
      />

      <TalentDetailHeader talent={talent} className="mt-3" />

      <div className="mt-5 gap-6 lg:flex lg:items-start">
        {/* ---------------- 본문 ---------------- */}
        <div className="min-w-0 flex-1 space-y-5">
          <DetailSection title="희망 근무조건" icon={ClipboardList}>
            <dl>
              <DetailRow label="희망 지역">{talent.regions.join(' · ')}</DetailRow>
              <DetailRow label="희망 직종">
                {talent.category ? jobCategoryLabel(talent.category) : null}
              </DetailRow>
              <DetailRow label="근무 시간대">{workScheduleLabel(talent.workSchedule) || '-'}</DetailRow>
              <DetailRow label="희망 근무시간">{talent.preferredHours}</DetailRow>
              <DetailRow label="희망 급여">
                {talent.payType && (
                  <span className="font-semibold tabular">
                    {formatPay(talent.payType, talent.payAmount)}
                  </span>
                )}
              </DetailRow>
            </dl>
          </DetailSection>

          <DetailSection title="경력 및 자격사항" icon={Award}>
            <dl>
              <DetailRow label="경력">{talent.careerLabel}</DetailRow>
              <DetailRow label="자격증">
                {talent.certificates.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {talent.certificates.map((certificate) => (
                      <li key={certificate}>
                        <Tag>{certificateTypeLabel(certificate)}</Tag>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailRow>
            </dl>
          </DetailSection>

          {talent.summary && (
            <DetailSection title="자기소개" icon={FileText}>
              <p className="text-base leading-relaxed whitespace-pre-line text-fg">
                {talent.summary}
              </p>
            </DetailSection>
          )}
        </div>

        {/* ---------------- 우측 연락처 열람 + 이용 안내 ---------------- */}
        <aside className="mt-5 w-full space-y-5 lg:mt-0 lg:w-[340px] lg:shrink-0">
          <ContactPanel talent={talent} onUnlocked={reload} />

          <section className="rounded-card border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
              <ShieldCheck className="size-5 shrink-0 text-primary-deep" aria-hidden />
              인재정보 이용 안내
            </h2>

            <ul className="mt-4 space-y-3">
              {[
                '인재의 상세 연락처는 승인된 시설 회원만 확인할 수 있습니다.',
                '개인정보 보호를 위해 이름은 일부만 표시되며, 연락처 열람 시 포인트가 차감됩니다.',
                '이미 열람한 인재는 다시 열람해도 포인트가 차감되지 않습니다.',
              ].map((notice) => (
                <li key={notice} className="flex gap-2.5 text-base text-fg-muted">
                  <Info className="mt-1 size-[18px] shrink-0 text-fg-subtle" aria-hidden />
                  <span>{notice}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {/* ---------------- 다른 인재정보 ---------------- */}
      {otherTalents.length > 0 && (
        <section className="mt-10 lg:mt-12">
          <SectionHeader
            title="다른 인재정보"
            description="같은 희망직종의 다른 인재예요."
            moreHref="/talents"
          />
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherTalents.map((other) => (
              <li key={other.id} className="flex">
                <TalentListCard talent={other} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/**
 * 연락처 열람 패널. 시설회원만 호출 가능한 API 라 그 외 역할(관리자)에서는 버튼을 숨긴다.
 * 열람 성공 시 상세를 다시 불러와(reload) contactUnlocked/phone/residence 를 갱신한다.
 */
function ContactPanel({ talent, onUnlocked }: { talent: Talent; onUnlocked: () => void }) {
  const { user } = useApp()
  const { toast } = useToast()
  const [unlocking, setUnlocking] = useState(false)

  const canUnlock = user?.role === 'FACILITY'

  async function handleUnlock() {
    setUnlocking(true)
    try {
      await unlockContact(talent.id)
      onUnlocked()
      toast({ variant: 'success', title: '연락처를 확인했습니다.' })
    } catch (err) {
      toast({
        variant: 'error',
        title: '연락처 열람에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
        <Phone className="size-5 shrink-0 text-primary-deep" aria-hidden />
        연락처
      </h2>

      {talent.contactUnlocked ? (
        <div className="mt-4 space-y-2">
          <p className="text-xl font-bold text-fg tabular">{talent.phone}</p>
          <p className="text-base text-fg-muted">{talent.residence}</p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-lg text-fg-muted tabular">{talent.phone}</p>
          <p className="mt-1 text-base text-fg-muted">{talent.residence}</p>
          <Button block className="mt-4" onClick={handleUnlock} disabled={!canUnlock || unlocking}>
            {unlocking
              ? '처리 중…'
              : canUnlock
                ? `연락처 열람 (${formatNumber(talent.unlockCost ?? 0)}P)`
                : '시설회원만 열람할 수 있습니다'}
          </Button>
        </div>
      )}
    </section>
  )
}

/** 존재하지 않는 인재 ID (COMPONENT_RULES.md §31 EmptyState 재사용) */
function TalentNotFound({ description }: { description?: string }) {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
        <EmptyState
          title="인재정보를 찾을 수 없습니다."
          description={description ?? '요청하신 인재정보가 삭제되었거나 존재하지 않는 프로필입니다.'}
          action={
            <Link to="/talents" className={cn(buttonVariants({ variant: 'secondary' }))}>
              인재정보 목록으로 돌아가기
            </Link>
          }
        />
      </div>
    </div>
  )
}
