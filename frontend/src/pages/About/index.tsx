import { HeartHandshake, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { CUSTOMER_SERVICE } from '@/lib/site'
import { SupportPage } from '@/pages/Support/shared'

const VALUES = [
  {
    icon: ShieldCheck,
    title: '신뢰할 수 있는 매칭',
    description:
      '자격증·경력 정보를 확인한 요양보호사, 간병인, 가사도우미만 인재정보에 노출해 시설이 안심하고 채용할 수 있게 합니다.',
  },
  {
    icon: HeartHandshake,
    title: '사람 중심의 돌봄',
    description:
      '구인·구직을 잇는 데서 그치지 않고, 어르신과 보호자가 믿고 맡길 수 있는 돌봄 문화를 함께 만들어갑니다.',
  },
  {
    icon: Sparkles,
    title: '더 쉬운 지원 경험',
    description:
      '복잡한 서류 없이 몇 번의 클릭만으로 지원부터 자격증 등록, 근무조건 매칭까지 한 번에 끝낼 수 있습니다.',
  },
]

const STATS = [
  { label: '누적 구인공고', value: '3,200+' },
  { label: '등록 요양시설', value: '850+' },
  { label: '누적 매칭 건수', value: '12,400+' },
]

/**
 * `/about` — 회사소개. 백엔드 의존 없는 정적 소개 페이지 (더미 콘텐츠).
 * 통계 수치는 서비스 성격을 보여주기 위한 예시 값이며 실제 집계 연동 전까지는 고정값이다.
 */
export function AboutPage() {
  return (
    <SupportPage crumbs={[{ label: '회사소개' }]} title="회사소개">
      <section className="rounded-card border border-border bg-gradient-to-r from-primary-light to-accent-light p-6 lg:p-10">
        <p className="text-base text-fg-muted">사람과 사람을 이어주는 요양 일자리 플랫폼</p>
        <h2 className="mt-2 text-2xl font-bold text-primary-deep lg:text-3xl">
          케어매치는 요양보호사·간병인·가사도우미와
          <br />
          요양시설을 가장 빠르고 믿을 수 있게 연결합니다.
        </h2>
        <p className="mt-4 max-w-[640px] text-base leading-relaxed text-fg">
          급하게 인력을 구해야 하는 요양시설과, 조건에 맞는 일자리를 찾는 구직자 모두가 겪던 불편함에서
          출발했습니다. 자격 정보 확인, 지역·근무조건 매칭, 지원까지 — 케어매치 하나로 해결하는 것이
          목표입니다.
        </p>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-card border border-border bg-surface p-5 text-center">
            <p className="text-2xl font-bold text-primary-deep tabular">{stat.value}</p>
            <p className="mt-1 text-sm text-fg-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 lg:mt-12">
        <h3 className="flex items-center gap-2 text-xl font-bold text-fg">
          <UsersRound className="size-5 shrink-0 text-primary-deep" aria-hidden />
          케어매치가 지키는 원칙
        </h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-card border border-border bg-surface p-5">
              <span className="grid size-11 place-items-center rounded-[8px] bg-primary-light text-primary-deep">
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-lg font-bold text-fg">{title}</p>
              <p className="mt-1.5 text-base text-fg-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-card border border-border bg-surface p-6 lg:mt-12">
        <h3 className="text-lg font-bold text-fg">회사 정보</h3>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-base sm:grid-cols-2">
          <div className="flex justify-between gap-4 sm:justify-start">
            <dt className="text-fg-muted">상호</dt>
            <dd className="text-fg">주식회사 케어매치</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-start">
            <dt className="text-fg-muted">대표</dt>
            <dd className="text-fg">홍길동</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-start">
            <dt className="text-fg-muted">사업자등록번호</dt>
            <dd className="text-fg tabular">123-45-67890</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-start">
            <dt className="text-fg-muted">설립일</dt>
            <dd className="text-fg tabular">2026.01.02</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-start sm:col-span-2">
            <dt className="text-fg-muted">주소</dt>
            <dd className="text-fg">대전광역시 서구 대덕대로 179, 10층</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-start">
            <dt className="text-fg-muted">고객센터</dt>
            <dd className="text-fg tabular">{CUSTOMER_SERVICE.tel}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-start">
            <dt className="text-fg-muted">이메일</dt>
            <dd className="text-fg">{CUSTOMER_SERVICE.email}</dd>
          </div>
        </dl>
      </section>
    </SupportPage>
  )
}
