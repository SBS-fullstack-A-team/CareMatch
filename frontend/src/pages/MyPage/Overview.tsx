import { Award, Briefcase, Building2, Coins, Eye, FileText, Heart, Megaphone, MessageSquare, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '@/components/common/loading-state'
import { PointChargeModal } from '@/components/mypage/point-charge-modal'
import { Button } from '@/components/ui/button'
import { getJobPosting } from '@/api/job-postings'
import { useApp, type SessionUser } from '@/hooks/use-app'
import { getTodayViewedJobIds } from '@/lib/recently-viewed-jobs'
import { formatNumber } from '@/lib/utils'
import type { JobPostingDetailResponse } from '@/types/api'

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

      {user.role === 'GENERAL' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickLink to="/talents" icon={UsersRound} label="인재정보 둘러보기" />
          <QuickLink to="/mypage/scraps" icon={Heart} label="관심 공고" />
        </div>
      )}

      {user.memberType === 'facility' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickLink to="/mypage/jobs" icon={Briefcase} label="등록한 공고" />
          <QuickLink to="/mypage/scraps" icon={Heart} label="관심 인재" />
        </div>
      )}

      {user.role === 'ADMIN' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/mypage/admin/members" icon={UsersRound} label="회원관리" />
          <QuickLink to="/mypage/admin/point-charges" icon={Coins} label="포인트충전관리" />
          <QuickLink to="/mypage/admin/facilities" icon={Building2} label="시설관리" />
          <QuickLink to="/mypage/admin/inquiries" icon={MessageSquare} label="문의관리" />
          <QuickLink to="/mypage/admin/notices" icon={Megaphone} label="공지사항" />
        </div>
      )}

      {user.role !== 'FACILITY' && user.role !== 'ADMIN' && <RecentlyViewedJobs />}
    </div>
  )
}

function ProfileSummary({ user }: { user: SessionUser }) {
  const kindLabel =
    user.memberType === 'facility'
      ? '시설회원'
      : user.role === 'ADMIN'
        ? '관리자'
        : user.role === 'GENERAL'
          ? '보호자회원'
          : '구직회원'

  /** 포인트는 보호자회원·시설회원·관리자만 사용한다 (구직회원은 포인트 개념이 없다). */
  const canUsePoint = user.role === 'GENERAL' || user.role === 'ADMIN' || user.memberType === 'facility'

  const [chargeOpen, setChargeOpen] = useState(false)

  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <p className="text-sm text-fg-muted">{kindLabel}</p>
      <h1 className="mt-1 text-2xl font-bold text-fg">{user.name}님</h1>
      <p className="mt-1.5 text-base text-fg-muted">{user.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-border pt-4">
        {canUsePoint && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-fg-muted">보유 포인트</p>
              <p className="mt-0.5 text-lg font-bold text-primary-deep tabular">{formatNumber(user.point)}P</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setChargeOpen(true)}>
              <Coins className="size-4" aria-hidden />
              충전
            </Button>
          </div>
        )}
        {user.memberType === 'facility' && user.facilityApprovalStatus && (
          <div>
            <p className="text-sm text-fg-muted">승인 상태</p>
            <p className="mt-0.5 text-lg font-bold text-fg">
              {APPROVAL_LABEL[user.facilityApprovalStatus] ?? user.facilityApprovalStatus}
            </p>
          </div>
        )}
      </div>

      {canUsePoint && <PointChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />}
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

const PAY_LABEL: Record<JobPostingDetailResponse['payType'], string> = {
  HOURLY: '시급',
  DAILY: '일급',
  MONTHLY: '월급',
}

/**
 * "오늘 본 공고" — JobDetail 진입 시 lib/recently-viewed-jobs 가 localStorage 에 기록해 둔
 * 오늘 날짜 공고 id들을 불러와 요약으로 보여준다. 백엔드 조회이력이 없어 완전히 프론트 전용이며,
 * 기록이 없거나 API 조회에 실패한 공고는 조용히 목록에서 빠진다(화면은 항상 정상 렌더).
 */
function RecentlyViewedJobs() {
  const [jobs, setJobs] = useState<JobPostingDetailResponse[] | null>(null)

  useEffect(() => {
    let alive = true
    const ids = getTodayViewedJobIds()
    if (ids.length === 0) {
      setJobs([])
      return
    }
    Promise.allSettled(ids.map((id) => getJobPosting(id))).then((results) => {
      if (!alive) return
      const ok = results
        .filter((r): r is PromiseFulfilledResult<JobPostingDetailResponse> => r.status === 'fulfilled')
        .map((r) => r.value)
      setJobs(ok)
    })
    return () => {
      alive = false
    }
  }, [])

  if (jobs === null) {
    return (
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
          <Eye className="size-5 shrink-0 text-primary-deep" aria-hidden />
          오늘 본 공고
        </h2>
        <div className="mt-3 overflow-hidden rounded-card border border-border">
          <LoadingState rows={2} />
        </div>
      </section>
    )
  }

  if (jobs.length === 0) return null

  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
        <Eye className="size-5 shrink-0 text-primary-deep" aria-hidden />
        오늘 본 공고
      </h2>
      <ul className="mt-3 overflow-hidden rounded-card border border-border bg-surface">
        {jobs.map((job) => (
          <li key={job.id} className="border-b border-border last:border-b-0">
            <Link
              to={`/jobs/${job.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-primary-light/40"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-fg">{job.title}</span>
                <span className="mt-0.5 block truncate text-sm text-fg-muted">
                  {job.facilityName} · {job.sido} {job.sigungu} · {PAY_LABEL[job.payType]}{' '}
                  {formatNumber(job.payAmount)}원
                  {job.status === 'CLOSED' && ' · 마감'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
