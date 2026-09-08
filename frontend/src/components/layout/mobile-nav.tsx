import { Bell, ChevronRight, Coins, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Drawer } from '@/components/ui/drawer'
import { buttonVariants } from '@/components/ui/button'
import { FONT_SCALES, FONT_SCALE_LABEL, useApp } from '@/hooks/use-app'
import { MAIN_NAV } from '@/lib/nav'
import { cn, formatNumber } from '@/lib/utils'

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout, fontScale, setFontScale } = useApp()

  return (
    <Drawer open={open} onClose={onClose} title="전체 메뉴">
      {user ? (
        <div className="rounded-card border border-border bg-surface-sunken p-4">
          <p className="text-lg font-bold text-fg">
            {user.name}
            <span className="ml-1.5 text-sm font-normal text-fg-muted">
              {user.memberType === 'facility' ? '시설회원' : '개인회원'}
            </span>
          </p>
          <p className="mt-0.5 text-base text-fg-muted">{user.subtitle}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to="/mypage/point"
              onClick={onClose}
              className="flex h-11 items-center justify-center gap-1.5 rounded-btn bg-surface text-base font-bold text-fg"
            >
              <Coins className="size-[18px] text-accent" aria-hidden />
              <span className="tabular">{formatNumber(user.point)}P</span>
            </Link>
            <Link
              to="/notifications"
              onClick={onClose}
              className="flex h-11 items-center justify-center gap-1.5 rounded-btn bg-surface text-base font-bold text-fg"
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
          {MAIN_NAV.map((item) => (
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
        <p className="text-base font-bold text-fg-muted">글자크기</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FONT_SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              onClick={() => setFontScale(scale)}
              className={cn(
                'h-12 rounded-btn border text-base font-bold transition-colors',
                fontScale === scale
                  ? 'border-primary bg-primary-light text-primary-deep'
                  : 'border-border-strong bg-surface text-fg-muted',
              )}
            >
              {FONT_SCALE_LABEL[scale]}
            </button>
          ))}
        </div>
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
