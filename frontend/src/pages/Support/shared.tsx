import { LogIn } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb, type BreadcrumbItem } from '@/components/common/breadcrumb'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { buttonVariants } from '@/components/ui/button'
import { useApp } from '@/hooks/use-app'
import { cn, formatDotDate } from '@/lib/utils'

/** 고객센터 각 화면의 공통 껍데기 — Breadcrumb + 제목 + 설명 */
export function SupportPage({
  crumbs,
  title,
  description,
  children,
}: {
  crumbs: BreadcrumbItem[]
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb items={[{ label: '홈', to: '/' }, ...crumbs]} />
      <header className="mt-3">
        <h1 className="text-3xl font-bold text-fg">{title}</h1>
        {description && <p className="mt-2 text-base text-fg-muted">{description}</p>}
      </header>
      <div className="mt-6">{children}</div>
    </div>
  )
}

/**
 * 문의 관련 화면의 로그인 게이트.
 * 기존 useApp() 의 authReady / user 만 사용한다 (라우트 가드를 새로 만들지 않는다).
 * authReady 전에는 로그인 여부를 판단하지 않는다.
 */
export function useSupportAuthGate() {
  const { user, authReady } = useApp()
  return { user, authReady }
}

export function LoginRequired({ from, description }: { from: string; description: string }) {
  return (
    <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
      <EmptyState
        title="로그인이 필요합니다."
        description={description}
        action={
          <Link
            to="/login"
            state={{ from }}
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            <LogIn aria-hidden />
            로그인하러 가기
          </Link>
        }
      />
    </div>
  )
}

/** API 실패 안내 — 기존 EmptyState 를 재사용한다 */
export function LoadFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-card border border-border bg-surface">
      <EmptyState
        title="정보를 불러오지 못했습니다."
        description={message}
        action={
          <button
            type="button"
            onClick={onRetry}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
          >
            다시 시도
          </button>
        }
      />
    </div>
  )
}

export function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-border">
      <LoadingState rows={rows} />
    </div>
  )
}

/**
 * 서버 LocalDateTime("2026-09-09T02:25:47.632899") 을 화면 표기로 바꾼다.
 * 기존 formatDotDate 는 "YYYY-MM-DD" 를 받으므로 날짜 부분만 잘라 넘긴다.
 */
export function formatServerDate(value: string) {
  return formatDotDate(value.slice(0, 10))
}

/** "2026.09.09 02:25" */
export function formatServerDateTime(value: string) {
  return `${formatServerDate(value)} ${value.slice(11, 16)}`
}
