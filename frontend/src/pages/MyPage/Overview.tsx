import { Award, Building2, FileText, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp, type SessionUser } from '@/hooks/use-app'
import { formatNumber } from '@/lib/utils'

const APPROVAL_LABEL: Record<string, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인 완료',
  REJECTED: '승인 거절',
}

/** `/mypage` — 프로필 요약 + 하위 화면 바로가기. 레이아웃이 이미 로그인 게이트를 걸어 `user` 는 항상 있다. */
export function MyPageOverviewPage() {
  const { user } = useApp()
  if (!user) return null

  return (
    <div className="space-y-5">
      <ProfileSummary user={user} />

      {user.role === 'JOBSEEKER' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickLink to="/mypage/applications" icon={FileText} label="지원 현황" />
          <QuickLink to="/mypage/scraps" icon={Heart} label="관심 공고" />
          <QuickLink to="/mypage/certificates" icon={Award} label="자격증" />
        </div>
      )}

      {user.memberType === 'facility' && (
        <div className="rounded-card border border-border bg-surface p-6">
          <div className="flex items-center gap-2 text-fg-muted">
            <Building2 className="size-[18px] shrink-0" aria-hidden />
            <p className="text-base">등록한 공고·관심 인재 관리는 다음 단계에서 제공될 예정입니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileSummary({ user }: { user: SessionUser }) {
  const kindLabel = user.memberType === 'facility' ? '시설회원' : user.role === 'ADMIN' ? '관리자' : '개인회원'

  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <p className="text-sm text-fg-muted">{kindLabel}</p>
      <h1 className="mt-1 text-2xl font-bold text-fg">{user.name}님</h1>
      <p className="mt-1.5 text-base text-fg-muted">{user.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-border pt-4">
        <div>
          <p className="text-sm text-fg-muted">보유 포인트</p>
          <p className="mt-0.5 text-lg font-bold text-primary-deep tabular">{formatNumber(user.point)}P</p>
        </div>
        {user.memberType === 'facility' && user.facilityApprovalStatus && (
          <div>
            <p className="text-sm text-fg-muted">승인 상태</p>
            <p className="mt-0.5 text-lg font-bold text-fg">
              {APPROVAL_LABEL[user.facilityApprovalStatus] ?? user.facilityApprovalStatus}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof FileText
  label: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-primary-light/40"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-light text-primary-deep">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-base font-semibold text-fg">{label}</span>
    </Link>
  )
}
