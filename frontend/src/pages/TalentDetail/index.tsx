import { Award, ClipboardList, FileText, Info, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DetailRow, DetailSection } from '@/components/common/detail-section'
import { EmptyState } from '@/components/common/empty-state'
import { SectionHeader } from '@/components/common/section-header'
import { TalentDetailHeader } from '@/components/talent/talent-detail-header'
import { TalentListCard } from '@/components/talent/talent-list-card'
import { buttonVariants } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import { certificateTypeLabel, jobCategoryLabel, workScheduleLabel } from '@/data/labels'
import { getTalentById, TALENTS } from '@/data/mock/talents'
import { cn, formatPay } from '@/lib/utils'
import type { Talent } from '@/types'

/** 하단 "다른 인재정보" — 추천 모델이 아니라 같은 희망직종 우선의 단순 선별이다 */
function pickOtherTalents(current: Talent, limit = 3) {
  return TALENTS.filter((talent) => talent.id !== current.id)
    .sort(
      (a, b) =>
        Number(b.category === current.category) - Number(a.category === current.category) ||
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit)
}

/**
 * 인재정보 상세 (COMPONENT_RULES.md §15 / DESIGN_SYSTEM.md §6)
 *
 * Breadcrumb → 프로필 핵심 → (본문) 희망 근무조건·경력/자격·자기소개 + (우측) 이용 안내
 * → 다른 인재정보
 *
 * 구인공고 상세와 같은 레이아웃 언어(본문 1fr + 우측 340px, 콘텐츠 1200px)를 쓰지만,
 * 우측은 지원 액션이 아니라 안내 영역이다. 연락처 열람 기능이 프론트에 없으므로
 * 동작하지 않는 CTA 버튼을 만들지 않는다.
 *
 * 데이터가 없는 항목은 행/섹션 자체를 렌더링하지 않는다.
 */
export function TalentDetailPage() {
  const { talentId } = useParams()
  const talent = talentId ? getTalentById(talentId) : undefined

  const otherTalents = useMemo(() => (talent ? pickOtherTalents(talent) : []), [talent])

  if (!talent) return <TalentNotFound />

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
              <DetailRow label="희망 직종">{jobCategoryLabel(talent.category)}</DetailRow>
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

        {/* ---------------- 우측 이용 안내 ---------------- */}
        <aside className="mt-5 w-full lg:mt-0 lg:w-[340px] lg:shrink-0">
          <section className="rounded-card border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
              <ShieldCheck className="size-5 shrink-0 text-primary-deep" aria-hidden />
              인재정보 이용 안내
            </h2>

            <ul className="mt-4 space-y-3">
              {[
                '인재의 상세 연락처는 승인된 시설 회원만 확인할 수 있습니다.',
                '개인정보 보호를 위해 이름은 일부만 표시되며, 연락처는 이 화면에서 제공하지 않습니다.',
                '연락처 열람 기능은 API 연동 단계에서 연결될 예정입니다.',
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

/** 존재하지 않는 인재 ID (COMPONENT_RULES.md §31 EmptyState 재사용) */
function TalentNotFound() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
        <EmptyState
          title="인재정보를 찾을 수 없습니다."
          description="요청하신 인재정보가 삭제되었거나 존재하지 않는 프로필입니다."
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
