import type { ReactNode } from 'react'
import { EmptyState } from '@/components/common/empty-state'
import { useApp } from '@/hooks/use-app'
import { formatNumber } from '@/lib/utils'

/** 관리자 화면 공통 상단 — 제목 + 설명 + 우측 액션(작성 버튼 등) */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-fg">{title}</h1>
        {description && <p className="mt-1.5 text-base text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** role !== 'ADMIN' 인 사용자가 URL을 직접 입력해 들어왔을 때. */
export function AdminAccessDenied() {
  return (
    <div className="rounded-card border border-border bg-surface">
      <EmptyState title="접근 권한이 없습니다." description="관리자만 이용할 수 있는 화면입니다." />
    </div>
  )
}

/**
 * /mypage/admin/* 라우트 가드. MyPageLayout 이 로그인은 이미 보장하므로 여기서는
 * role === 'ADMIN' 만 다시 확인한다(사이드메뉴엔 안 보이지만 URL 직접 접근은 막아야 함).
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useApp()
  if (user?.role !== 'ADMIN') return <AdminAccessDenied />
  return <>{children}</>
}

/** 목록 상단 전체 건수 표기. */
export function AdminTotalCount({ count }: { count: number }) {
  return (
    <p className="mb-3 text-base text-fg-muted">
      전체 <strong className="font-bold text-primary-deep tabular">{formatNumber(count)}</strong>건
    </p>
  )
}
