import { Bell, Coins, Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FontSizeControl } from '@/components/layout/font-size-control'
import { Logo } from '@/components/layout/logo'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ProfileDropdown } from '@/components/layout/profile-dropdown'
import { buttonVariants } from '@/components/ui/button'
import { useApp } from '@/hooks/use-app'
import { MAIN_NAV } from '@/lib/nav'
import { cn, formatNumber } from '@/lib/utils'

/** DESIGN_SYSTEM.md §25 */
export function Header() {
  const { user } = useApp()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-chrome items-center gap-4 px-4 md:px-6 lg:h-[72px] lg:gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <Logo />
          {/* 로고 옆 세로 구분선 + 2줄 태그라인 */}
          <span aria-hidden className="hidden h-8 w-px bg-border 2xl:block" />
          <p className="hidden text-xs leading-snug text-fg-muted 2xl:block">
            사람과 사람을 이어주는
            <br />
            요양 일자리 플랫폼
          </p>
        </div>

        <nav aria-label="주 메뉴" className="hidden min-w-0 flex-1 justify-center lg:flex">
          <ul className="flex items-center">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex h-[72px] items-center px-3 text-base font-bold whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-b-2 border-primary text-primary-deep'
                        : 'text-fg hover:text-primary-deep',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-3">
          <FontSizeControl className="hidden xl:flex" />

          {user ? (
            <>
              <span aria-hidden className="hidden h-6 w-px bg-border xl:block" />

              <Link
                to="/mypage/point"
                className="hidden h-11 items-center gap-1.5 rounded-btn border border-border px-3 text-base font-semibold text-fg transition-colors hover:border-primary/40 hover:bg-primary-light xl:flex"
              >
                <Coins className="size-[18px] text-accent" aria-hidden />
                <span className="tabular">{formatNumber(user.point)}P</span>
              </Link>

              <Link
                to="/notifications"
                className="relative grid size-11 place-items-center rounded-btn text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
                aria-label={`알림 ${user.unreadNotifications}건`}
              >
                <Bell className="size-5" aria-hidden />
                {user.unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-danger text-xs font-bold text-white tabular">
                    {user.unreadNotifications}
                  </span>
                )}
              </Link>

              <div className="hidden lg:block">
                <ProfileDropdown user={user} />
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link to="/login" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                로그인
              </Link>
              <Link to="/signup" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
                회원가입
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="메뉴 열기"
            className="grid size-11 place-items-center rounded-btn text-fg transition-colors hover:bg-surface-sunken lg:hidden"
          >
            <Menu className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  )
}
