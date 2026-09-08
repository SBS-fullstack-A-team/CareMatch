import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/logo'
import { FOOTER_NAV } from '@/lib/nav'
import { CUSTOMER_SERVICE } from '@/lib/site'

/** DESIGN_SYSTEM.md §26 — Dark Green 기반 Footer */
export function Footer() {
  return (
    <footer className="mt-16 bg-primary-deep text-white lg:mt-20">
      <div className="mx-auto flex w-full max-w-chrome flex-col gap-8 px-4 py-8 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
          <Logo tone="onDark" />
          <p className="text-sm text-white/70">사람과 사람을 이어주는 요양 일자리 플랫폼</p>
        </div>

        <nav aria-label="하단 메뉴">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {FOOTER_NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-base text-white/85 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:text-right">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85 lg:justify-end">
            <span>
              고객센터 <span className="font-bold text-white tabular">{CUSTOMER_SERVICE.tel}</span>
            </span>
            <span aria-hidden className="text-white/30">
              |
            </span>
            <a
              href={CUSTOMER_SERVICE.kakaoUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              카카오톡
            </a>
            <span aria-hidden className="text-white/30">
              |
            </span>
            <a
              href={`mailto:${CUSTOMER_SERVICE.email}`}
              className="transition-colors hover:text-white"
            >
              {CUSTOMER_SERVICE.email}
            </a>
          </p>
          <p className="mt-2 text-sm text-white/55">
            © 2025 케어매치. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
