import {
  Building2,
  ClipboardList,
  FileText,
  Heart,
  Info,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DetailRow, DetailSection } from '@/components/common/detail-section'
import { EmptyState } from '@/components/common/empty-state'
import { JobCard } from '@/components/job/job-card'
import { ElderlyInfoCard } from '@/components/job/elderly-info-card'
import { JobApplyPanel } from '@/components/job/job-apply-panel'
import { JobDetailHeader } from '@/components/job/job-detail-header'
import { SectionHeader } from '@/components/common/section-header'
import { MatchingScore } from '@/components/matching/matching-score'
import { Tag } from '@/components/ui/tag'
import { buttonVariants } from '@/components/ui/button'
import { employmentTypeLabel, facilityTypeLabel, jobCategoryLabel, workScheduleLabel } from '@/data/labels'
import { getJobById, getRelatedJobs } from '@/data/mock/jobs'
import { JOB_APPLY_NOTICES } from '@/lib/site'
import { cn, formatDotDate, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

/**
 * 구인공고 상세 (COMPONENT_RULES.md §21, §22)
 *
 * Breadcrumb → 공고 핵심 정보 → 근무조건 → 모집내용 → 어르신 정보 → 시설정보
 * → 지원방법 → 유의사항 → 비슷한 구인공고
 *
 * 본문 1fr + 우측 sticky 340px, 콘텐츠 폭은 다른 화면과 같은 1200px 를 유지한다.
 * 데이터가 없는 항목은 행/섹션 자체를 렌더링하지 않는다. (없는 정보를 만들지 않는다)
 */
export function JobDetailPage() {
  const { jobId } = useParams()
  const job = jobId ? getJobById(jobId) : undefined

  if (!job) return <JobNotFound />

  const relatedJobs = getRelatedJobs(job.id)

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb
        items={[
          { label: '구인공고', to: '/jobs' },
          { label: '구인공고 상세' },
        ]}
      />

      <JobDetailHeader job={job} className="mt-3" />

      <div className="mt-5 gap-6 lg:flex lg:items-start">
        {/* ---------------- 본문 ---------------- */}
        <div className="min-w-0 flex-1 space-y-5">
          <WorkConditionSection job={job} />
          <RecruitmentSection job={job} />

          {job.elderly && (
            <DetailSection title="어르신 정보" icon={Heart}>
              <ElderlyInfoCard elderly={job.elderly} />
            </DetailSection>
          )}

          <FacilitySection job={job} />
          <ApplicationSection job={job} />

          <DetailSection title="유의사항" icon={ShieldCheck}>
            <ul className="space-y-2.5">
              {JOB_APPLY_NOTICES.map((notice) => (
                <li key={notice} className="flex gap-2.5 text-base text-fg-muted">
                  <Info className="mt-1 size-[18px] shrink-0 text-fg-subtle" aria-hidden />
                  <span>{notice}</span>
                </li>
              ))}
            </ul>
          </DetailSection>
        </div>

        {/* ---------------- 우측 sticky 영역 ---------------- */}
        <aside className="mt-5 w-full space-y-5 lg:sticky lg:top-24 lg:mt-0 lg:w-[340px] lg:shrink-0">
          <JobApplyPanel job={job} />
          {job.matching && (
            <MatchingScore
              score={job.matching.score}
              reasons={job.matching.reasons}
              variant="detail"
            />
          )}
        </aside>
      </div>

      {/* ---------------- 비슷한 구인공고 ---------------- */}
      {relatedJobs.length > 0 && (
        <section className="mt-10 lg:mt-12">
          <SectionHeader
            title="비슷한 구인공고"
            description="같은 직종·지역의 다른 공고예요."
            moreHref="/jobs"
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedJobs.map((related) => (
              <JobCard key={related.id} job={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/** 근무조건 — Job 데이터에 존재하는 항목만 행으로 만든다 */
function WorkConditionSection({ job }: { job: Job }) {
  return (
    <DetailSection title="근무조건" icon={ClipboardList}>
      <dl>
        <DetailRow label="근무지역">
          {job.region}
          {job.district && ` ${job.district}`}
        </DetailRow>
        <DetailRow label="근무 시간대">{workScheduleLabel(job.workSchedule) || '-'}</DetailRow>
        <DetailRow label="근무시간">
          <span className="tabular">{job.workHours}</span>
        </DetailRow>
        <DetailRow label="근무요일">{job.workDays}</DetailRow>
        <DetailRow label="급여">
          <span className="font-semibold tabular">{formatPay(job.payType, job.payAmount)}</span>
        </DetailRow>
        <DetailRow label="고용형태">{employmentTypeLabel(job.employmentType)}</DetailRow>
        <DetailRow label="모집마감">
          {job.deadline ? (
            <span className="tabular">{formatDotDate(job.deadline)}</span>
          ) : (
            '상시채용'
          )}
        </DetailRow>
      </dl>
    </DetailSection>
  )
}

/** 모집내용 — 본문·자격요건·우대사항·복리후생 중 데이터가 있는 것만 */
function RecruitmentSection({ job }: { job: Job }) {
  const hasBody =
    job.description ||
    job.requirements?.length ||
    job.preferences?.length ||
    job.benefits?.length ||
    job.tags?.length

  if (!hasBody) return null

  return (
    <DetailSection title="모집내용" icon={FileText}>
      <div className="space-y-6">
        <SubBlock title="모집직종">
          <p className="text-base text-fg">{jobCategoryLabel(job.category)}</p>
        </SubBlock>

        {job.description && (
          <SubBlock title="상세 내용">
            <p className="text-base leading-relaxed whitespace-pre-line text-fg">
              {job.description}
            </p>
          </SubBlock>
        )}

        {job.requirements && job.requirements.length > 0 && (
          <SubBlock title="자격요건">
            <BulletList items={job.requirements} />
          </SubBlock>
        )}

        {job.preferences && job.preferences.length > 0 && (
          <SubBlock title="우대사항">
            <BulletList items={job.preferences} />
          </SubBlock>
        )}

        {job.benefits && job.benefits.length > 0 && (
          <SubBlock title="복리후생">
            <BulletList items={job.benefits} />
          </SubBlock>
        )}

        {job.tags && job.tags.length > 0 && (
          <SubBlock title="근무 조건 키워드">
            <ul className="flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
          </SubBlock>
        )}
      </div>
    </DetailSection>
  )
}

/** 시설정보 — 지도 기능이 없으므로 주소는 텍스트로만 표시한다 */
function FacilitySection({ job }: { job: Job }) {
  return (
    <DetailSection title="시설정보" icon={Building2}>
      <p className="text-lg font-bold text-fg">{job.facilityName}</p>
      <dl className="mt-4">
        <DetailRow label="시설유형">{facilityTypeLabel(job.facilityType)}</DetailRow>
        <DetailRow label="지역">
          {job.region}
          {job.district && ` ${job.district}`}
        </DetailRow>
        <DetailRow label="주소">{job.address}</DetailRow>
        <DetailRow label="담당자">{job.managerName}</DetailRow>
      </dl>
      {job.catchphrase && (
        <p className="mt-5 rounded-card bg-primary-light/60 px-4 py-3 text-base text-primary-deep">
          {job.catchphrase}
        </p>
      )}
    </DetailSection>
  )
}

/** 지원방법 — 실제 연락처가 있는 공고만 전화 지원을 노출한다 */
function ApplicationSection({ job }: { job: Job }) {
  return (
    <DetailSection title="지원방법" icon={UserRound}>
      <div className="space-y-5">
        <div>
          <p className="text-base font-semibold text-fg">온라인 지원</p>
          <p className="mt-1 text-base text-fg-muted">
            케어매치 구직신청서를 작성해 바로 지원할 수 있습니다.
          </p>
          <Link
            to={`/apply?jobId=${job.id}`}
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-3')}
          >
            온라인으로 지원하기
          </Link>
        </div>

        {job.managerPhone && (
          <div className="border-t border-border pt-5">
            <p className="text-base font-semibold text-fg">전화 지원</p>
            {job.managerName && (
              <p className="mt-1 text-base text-fg-muted">담당자 {job.managerName}</p>
            )}
            <a
              href={`tel:${job.managerPhone.replaceAll('-', '')}`}
              className="mt-2 inline-flex items-center gap-2 text-xl font-bold text-primary-deep tabular hover:underline"
            >
              <Phone className="size-5 shrink-0" aria-hidden />
              {job.managerPhone}
            </a>
          </div>
        )}
      </div>
    </DetailSection>
  )
}

function SubBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-bold text-fg">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-base text-fg">
          <span aria-hidden className="mt-[11px] size-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** 존재하지 않는 공고 ID (COMPONENT_RULES.md §31 EmptyState 재사용) */
function JobNotFound() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
        <EmptyState
          title="구인공고를 찾을 수 없습니다."
          description="요청하신 구인공고가 삭제되었거나 존재하지 않는 공고입니다."
          action={
            <Link to="/jobs" className={cn(buttonVariants({ variant: 'secondary' }))}>
              구인공고 목록으로 돌아가기
            </Link>
          }
        />
      </div>
    </div>
  )
}
