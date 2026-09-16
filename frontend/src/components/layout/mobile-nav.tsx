import { Bell, ChevronRight, Coins, LogOut, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Drawer } from '@/components/ui/drawer'
import { buttonVariants } from '@/components/ui/button'
import { FontSizeControl } from '@/components/layout/font-size-control'
import { useApp } from '@/hooks/use-app'
import { mainNavFor } from '@/lib/nav'
import { cn, formatNumber } from '@/lib/utils'

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useApp()

  return (
    <Drawer open={open} onClose={onClose} title="전체 메뉴">
      {user ? (
        <div className="rounded-card border border-border bg-surface-sunken p-4">
          <Link
            to="/mypage"
            onClick={onClose}
            className="-m-1 flex items-center justify-between gap-2 rounded-[6px] p-1"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-lg font-bold text-fg">
                <UserRound className="size-[18px] shrink-0 text-fg-muted" aria-hidden />
                {user.name}
                <span className="text-sm font-normal text-fg-muted">
                  {user.memberType === 'facility'
                    ? '시설회원'
                    : user.role === 'ADMIN'
                      ? '관리자'
                      : user.role === 'GENERAL'
                        ? '보호자회원'
                        : '구직회원'}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-base text-fg-muted">{user.subtitle}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(user.role === 'GENERAL' || user.role === 'ADMIN' || user.memberType === 'facility') && (
              <Link
                to="/mypage"
                onClick={onClose}
                className="flex h-11 items-center justify-center gap-1.5 rounded-btn bg-surface text-base font-bold text-fg"
              >
                <Coins className="size-[18px] text-accent" aria-hidden />
                <span className="tabular">{formatNumber(user.point)}P</span>
              </Link>
            )}
            <Link
              to="/notifications"
              onClick={onClose}
              className={cn(
                'flex h-11 items-center justify-center gap-1.5 rounded-btn bg-surface text-base font-bold text-fg',
                user.role !== 'GENERAL' &&
                  user.role !== 'ADMIN' &&
                  user.memberType !== 'facility' &&
                  'col-span-2',
              )}
            >
              <Bell className="size-[18px] text-fg-muted" aria-hidden />
              알림 {user.unreadNotifications}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/login"
            onClick={onClose}
            className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }))}
          >
            로그인
          </Link>
          <Link
            to="/signup"
            onClick={onClose}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }))}
          >
            회원가입
          </Link>
        </div>
      )}

      <nav aria-label="전체 메뉴" className="mt-5">
        <ul className="divide-y divide-border border-y border-border">
          {mainNavFor(user?.role).map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onClose}
                className="flex min-h-14 items-center justify-between text-lg font-bold text-fg"
              >
                {item.label}
                <ChevronRight className="size-5 text-fg-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">
        <FontSizeControl className="w-full" />
      </div>

      {user && (
        <button
          type="button"
          onClick={() => {
            logout()
            onClose()
          }}
          className="mt-6 flex items-center gap-2 text-base text-fg-muted"
        >
          <LogOut className="size-[18px]" aria-hidden />
          로그아웃
        </button>
      )}
    </Drawer>
  )
}
