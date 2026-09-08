import {
  ChevronDown,
  FileText,
  Heart,
  LogOut,
  Settings,
  UserRound,
  Building2,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, type SessionUser } from '@/hooks/use-app'
import { useClickOutside } from '@/hooks/use-click-outside'
import { cn, formatNumber } from '@/lib/utils'

const PERSONAL_MENU = [
  { to: '/mypage', label: '마이페이지', icon: UserRound },
  { to: '/mypage/applications', label: '지원 현황', icon: FileText },
  { to: '/mypage/scraps', label: '관심 공고', icon: Heart },
  { to: '/mypage/settings', label: '희망조건 설정', icon: Settings },
]

const FACILITY_MENU = [
  { to: '/mypage', label: '시설 관리', icon: Building2 },
  { to: '/mypage/jobs', label: '등록한 공고', icon: FileText },
  { to: '/mypage/scraps', label: '관심 인재', icon: Heart },
  { to: '/mypage/settings', label: '계정 설정', icon: Settings },
]

export function ProfileDropdown({ user }: { user: SessionUser }) {
  const { logout } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false))
  const menu = user.memberType === 'facility' ? FACILITY_MENU : PERSONAL_MENU

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-btn py-1 pr-2 pl-1.5 transition-colors',
          open ? 'bg-surface-sunken' : 'hover:bg-surface-sunken',
        )}
      >
        <span className="grid size-8 place-items-center rounded-full bg-primary-light text-base font-bold text-primary-deep">
          {user.name.slice(0, 1)}
        </span>
        <span className="hidden text-base font-bold text-fg lg:inline">{user.name}</span>
        <ChevronDown className="size-4 text-fg-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 rounded-card border border-border bg-surface p-1.5 shadow-overlay"
        >
          <div className="border-b border-border px-3 pt-2.5 pb-3">
            <p className="text-base font-bold text-fg">
              {user.name}
              <span className="ml-1.5 text-sm font-normal text-fg-muted">
                {user.memberType === 'facility' ? '시설회원' : '개인회원'}
              </span>
            </p>
            <p className="mt-0.5 truncate text-sm text-fg-muted">{user.subtitle}</p>
            <p className="mt-2 flex items-baseline justify-between text-sm text-fg-muted">
              보유 포인트
              <span className="text-base font-bold text-primary-deep tabular">
                {formatNumber(user.point)}P
              </span>
            </p>
          </div>

          <div className="py-1">
            {menu.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-base text-fg transition-colors hover:bg-surface-sunken"
              >
                <Icon className="size-[18px] text-fg-muted" aria-hidden />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logout()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-base text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
            >
              <LogOut className="size-[18px]" aria-hidden />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
