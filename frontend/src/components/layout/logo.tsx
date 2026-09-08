import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/** 케어매치 워드마크 — 헤더/푸터/로그인 화면에서 동일하게 사용 */
export function Logo({
  className,
  tone = 'color',
}: {
  className?: string
  /** color: 밝은 배경 / onDark: Dark Green 배경 (Footer) */
  tone?: 'color' | 'onDark'
}) {
  const onDark = tone === 'onDark'

  return (
    <Link
      to="/"
      className={cn('inline-flex items-center gap-2', className)}
      aria-label="케어매치 홈으로 이동"
    >
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden focusable="false">
        {!onDark && <rect width="30" height="30" rx="8" fill="var(--color-primary)" />}
        <path
          d="M15 22c-.4 0-.8-.15-1.1-.42l-4.9-4.5A4.6 4.6 0 0 1 7.5 13.6C7.5 10.9 9.6 9 12 9c1.2 0 2.3.5 3 1.3.7-.8 1.8-1.3 3-1.3 2.4 0 4.5 1.9 4.5 4.6 0 1.35-.55 2.6-1.5 3.48l-4.9 4.5c-.3.27-.7.42-1.1.42Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          'text-xl font-bold tracking-[-0.03em]',
          onDark ? 'text-white' : 'text-primary-deep',
        )}
      >
        케어매치
      </span>
    </Link>
  )
}
