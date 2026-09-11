import { Award, FileText, Heart, LogIn, Settings as SettingsIcon, UserRound } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { buttonVariants } from '@/components/ui/button'
import { useApp } from '@/hooks/use-app'
import { cn } from '@/lib/utils'

const JOBSEEKER_MENU = [
  { to: '/mypage', label: '마이페이지', icon: UserRound, end: true },
  { to: '/mypage/applications', label: '지원 현황', icon: FileText, end: false },
  { to: '/mypage/scraps', label: '관심 공고', icon: Heart, end: false },
  { to: '/mypage/certificates', label: '자격증', icon: Award, end: false },
  { to: '/mypage/settings', label: '설정', icon: SettingsIcon, end: false },
]

const FACILITY_MENU = [
  { to: '/mypage', label: '시설 관리', icon: UserRound, end: true },
  { to: '/mypage/scraps', label: '관심 인재', icon: Heart, end: false },
  { to: '/mypage/settings', label: '계정 설정', icon: SettingsIcon, end: false },
]

const ADMIN_MENU = [{ to: '/mypage', label: '마이페이지', icon: UserRound, end: true }]

/**
 * `/mypage/*` 공통 껍데기 — Breadcrumb + 좌측 사이드내비(역할별) + 우측 하위 페이지.
 * 로그인 게이트는 여기 한 곳에서만 건다. 하위 페이지는 `authReady`/`user` 존재를 다시 확인하지 않는다.
 */
export function MyPageLayout() {
  const { user, authReady } = useApp()

  if (!authReady) {
    return (
      <div className="container-page py-10">
        <LoadingState rows={2} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
          <EmptyState
            title="로그인이 필요합니다."
            description="마이페이지는 로그인 후 이용할 수 있습니다."
            action={
              <Link to="/login" state={{ from: '/mypage' }} className={cn(buttonVariants({ variant: 'primary' }))}>
                <LogIn aria-hidden />
                로그인하러 가기
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  // 소셜 최초 로그인 후 유형 미확정 — 마이페이지 대신 유형 선택으로 보낸다.
  if (user.role === 'GUEST') {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
          <EmptyState
            title="회원 유형 선택이 필요합니다."
            description="마이페이지를 이용하려면 유형(구직자/시설회원)을 먼저 선택해 주세요."
            action={
              <Link to="/oauth/select-role" className={cn(buttonVariants({ variant: 'primary' }))}>
                유형 선택하러 가기
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const menu =
    user.memberType === 'facility' ? FACILITY_MENU : user.role === 'ADMIN' ? ADMIN_MENU : JOBSEEKER_MENU

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb items={[{ label: '홈', to: '/' }, { label: '마이페이지' }]} />

      <div className="mt-3 gap-6 lg:flex lg:items-start">
        <aside className="w-full shrink-0 lg:w-[220px]">
          <nav
            aria-label="마이페이지 메뉴"
            className="overflow-hidden rounded-card border border-border bg-surface"
          >
            {menu.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 border-b border-border px-4 py-3 text-base text-fg transition-colors last:border-b-0',
                    isActive ? 'bg-primary-light font-bold text-primary-deep' : 'hover:bg-surface-sunken',
                  )
                }
              >
                <Icon className="size-[18px]" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="mt-5 min-w-0 flex-1 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
