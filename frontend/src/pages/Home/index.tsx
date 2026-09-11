import {
  ChevronRight,
  FileText,
  Headset,
  HeartHandshake,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Phone,
  Star,
  UserRound,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { JobSearchBar } from '@/components/common/search-bar'
import { JobCard } from '@/components/job/job-card'
import { JobTable } from '@/components/job/job-table'
import { SpecialJobCard } from '@/components/job/special-job-card'
import { Section } from '@/components/layout/section'
import { TalentCard } from '@/components/talent/talent-card'
import { buttonVariants } from '@/components/ui/button'
import { getNotices } from '@/api/support'
import { REGION_SHORTCUTS } from '@/data/filters'
import { LATEST_JOBS, RECOMMENDED_JOBS, SPECIAL_JOBS } from '@/data/mock/jobs'
import { LATEST_TALENTS } from '@/data/mock/talents'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { CUSTOMER_SERVICE } from '@/lib/site'
import { cn } from '@/lib/utils'
import { formatServerDate } from '@/pages/Support/shared'

/** 메인 페이지 — DESIGN_SYSTEM.md §27 의 공식 구조를 따른다 */
export function HomePage() {
  const { user } = useApp()

  return (
    <div className="container-page pb-4">
      <HeroBanner />

      <JobSearchBar className="mt-4" />

      {/* ---------------- 맞춤 공고 (4열) ---------------- */}
      <Section
        icon={Users}
        title={`${user?.name ?? '회원'}님께 맞는 공고`}
        description="님의 희망조건과 가장 잘 맞는 일자리예요."
        moreHref="/jobs?sort=matching"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECOMMENDED_JOBS.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </Section>

      {/* ---------------- 스페셜 채용정보 (3열) ---------------- */}
      <Section
        icon={Star}
        title="스페셜 채용정보"
        description="지금 가장 주목받는 채용공고입니다."
        moreHref="/jobs?status=special"
        tone="tinted"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {SPECIAL_JOBS.map((job) => (
            <SpecialJobCard key={job.id} job={job} />
          ))}
        </div>
      </Section>

      {/* ---------------- 최신 구인공고 (TABLE) ---------------- */}
      <Section icon={FileText} title="최신 구인공고" moreHref="/jobs">
        <JobTable jobs={LATEST_JOBS} />
      </Section>

      {/* ---------------- 최신 인재정보 (4열) ---------------- */}
      <Section icon={UserRound} title="최신 인재정보" moreHref="/talents">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LATEST_TALENTS.map((talent) => (
            <TalentCard key={talent.id} talent={talent} />
          ))}
        </div>
      </Section>

      {/* ---------------- 지역별 바로가기 ---------------- */}
      <Section icon={MapPin} title="지역별 바로가기">
        <ul className="flex flex-wrap gap-2">
          {REGION_SHORTCUTS.map((region) => (
            <li key={region.sido}>
              <Link
                to={`/jobs?sido=${encodeURIComponent(region.sido)}`}
                className="inline-flex h-11 items-center rounded-full border border-border bg-surface px-4 text-base text-fg transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-deep md:h-10 md:px-3.5"
              >
                {region.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- 공지사항 + 고객센터 (2열) ---------------- */}
      <div className="mt-10 grid gap-4 lg:mt-12 lg:grid-cols-2">
        <NoticeCard />
        <CustomerServiceCard />
      </div>
    </div>
  )
}

/** DESIGN_SYSTEM.md §17 — 검색을 포함하지 않는 배너 */
function HeroBanner() {
  return (
    <section className="mt-4 overflow-hidden rounded-card bg-gradient-to-r from-primary-light to-accent-light">
      <div className="flex flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:gap-10 lg:px-10 lg:py-10">
        <div className="flex-1">
          <p className="text-base text-fg-muted">좋은 일자리, 더 나은 내일을 위해</p>
          <h1 className="mt-2 text-3xl font-bold text-primary-deep lg:text-4xl">
            요양 인력과 시설을 연결하는
            <br />
            케어매치
          </h1>
        </div>

        <p className="text-base leading-relaxed text-fg lg:w-[220px]">
          믿을 수 있는 매칭으로
          <br />더 따뜻한 돌봄을 만들어갑니다.
        </p>

        {/*
          일러스트 자리. 실제 이미지가 들어와도 영역 크기는 그대로 유지한다.
          (DESIGN_SYSTEM.md §32)
        */}
        <div
          aria-hidden
          className="hidden h-[180px] w-[300px] shrink-0 place-items-center rounded-card bg-surface/40 text-primary/40 lg:grid"
        >
          <HeartHandshake className="size-16" strokeWidth={1.5} />
        </div>
      </div>
    </section>
  )
}

/**
 * DESIGN_SYSTEM.md §23
 * 홈에서 유일하게 실 API 를 쓰는 섹션(`GET /api/support/notices`). 나머지 홈 섹션(공고·인재)은
 * 아직 mock 이라 이 카드만 로딩/에러 처리를 갖는다 — 실패해도 홈 전체는 깨지지 않도록
 * 에러 메시지 대신 "등록된 공지가 없습니다." 로 조용히 대체한다.
 */
function NoticeCard() {
  const { data, loading } = useAsync(() => getNotices(0, 3), [])
  const notices = data?.content ?? []

  return (
    <section className="min-w-0 rounded-card border border-border bg-surface p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-fg">
          <Megaphone className="size-5 shrink-0 text-primary-deep" aria-hidden />
          공지사항
        </h2>
        <Link
          to="/support/notice"
          className="inline-flex items-center gap-0.5 text-base text-fg-muted hover:text-primary-deep"
        >
          더보기
          <ChevronRight className="size-[18px]" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <ul className="mt-4 space-y-3.5" aria-hidden>
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="h-[18px] w-full animate-pulse rounded-input bg-surface-sunken" />
          ))}
        </ul>
      ) : notices.length === 0 ? (
        <p className="mt-4 text-base text-fg-muted">등록된 공지가 없습니다.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notices.map((notice) => (
            <li key={notice.id} className="flex items-baseline justify-between gap-4">
              <Link
                to={`/support/notice/${notice.id}`}
                className="min-w-0 flex-1 truncate text-base text-fg hover:text-primary-deep hover:underline"
              >
                {notice.title}
              </Link>
              <span className="shrink-0 text-xs text-fg-subtle tabular">
                {formatServerDate(notice.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** DESIGN_SYSTEM.md §24 */
function CustomerServiceCard() {
  return (
    <section className="min-w-0 rounded-card border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-fg">
        <Headset className="size-5 shrink-0 text-primary-deep" aria-hidden />
        고객센터
      </h2>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2">
            <Phone className="size-5 shrink-0 text-primary" aria-hidden />
            <a
              href={CUSTOMER_SERVICE.telHref}
              className="text-3xl font-bold text-fg tabular hover:text-primary-deep"
            >
              {CUSTOMER_SERVICE.tel}
            </a>
          </p>
          <p className="mt-2 text-base text-fg-muted">
            {CUSTOMER_SERVICE.weekday} ({CUSTOMER_SERVICE.lunch})
          </p>
        </div>

        <Link to="/support/inquiry" className={cn(buttonVariants({ variant: 'primaryDeep' }))}>
          1:1 문의하기
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
        <a
          href={CUSTOMER_SERVICE.kakaoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-base text-fg-muted hover:text-primary-deep"
        >
          <MessageSquare className="size-5 shrink-0" aria-hidden />
          카카오톡 상담하기
        </a>
        <a
          href={`mailto:${CUSTOMER_SERVICE.email}`}
          className="inline-flex items-center gap-2 text-base text-fg-muted hover:text-primary-deep"
        >
          <Mail className="size-5 shrink-0" aria-hidden />
          {CUSTOMER_SERVICE.email}
        </a>
      </div>
    </section>
  )
}
