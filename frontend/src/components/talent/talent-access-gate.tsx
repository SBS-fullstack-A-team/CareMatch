import { LogIn } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { buttonVariants } from '@/components/ui/button'
import { useApp, type SessionUser } from '@/hooks/use-app'
import { cn } from '@/lib/utils'

/**
 * 인재정보(`/talents`, `/talents/:id`) 접근 게이트.
 *
 * 인재 정보(이름·나이·경력·자격증·희망조건)는 개인정보라 **승인 시설회원·관리자**만
 * 열람할 수 있다 (백엔드 `GET /api/jobseekers` = `hasAnyRole('FACILITY','ADMIN')` + 승인,
 * docs/API.md §6). 비로그인·구직자·미승인 시설은 안내 화면을 보여준다.
 */
export function TalentAccessGate({ children }: { children: ReactNode }) {
  const { user, authReady } = useApp()
  const location = useLocation()

  if (!authReady) {
    return (
      <div className="container-page py-10">
        <LoadingState rows={2} />
      </div>
    )
  }

  const allowed =
    user != null &&
    (user.role === 'ADMIN' ||
      (user.role === 'FACILITY' && user.facilityApprovalStatus === 'APPROVED'))

  if (allowed) return <>{children}</>

  return <AccessBlocked user={user} from={location.pathname + location.search} />
}

function AccessBlocked({ user, from }: { user: SessionUser | null; from: string }) {
  const { title, description, action } = resolve(user, from)
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
        <EmptyState title={title} description={description} action={action} />
      </div>
    </div>
  )
}

function resolve(user: SessionUser | null, from: string) {
  if (user == null) {
    return {
      title: '로그인이 필요합니다.',
      description: '인재정보는 승인된 시설회원만 열람할 수 있어 로그인 후 이용할 수 있습니다.',
      action: (
        <Link
          to="/login"
          state={{ from }}
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          <LogIn aria-hidden />
          로그인하러 가기
        </Link>
      ),
    }
  }

  if (user.role === 'FACILITY' && user.facilityApprovalStatus === 'PENDING') {
    return {
      title: '관리자 승인 대기 중입니다.',
      description: '시설 회원 승인이 완료되면 인재정보를 열람할 수 있습니다.',
      action: null,
    }
  }

  if (user.role === 'FACILITY' && user.facilityApprovalStatus === 'REJECTED') {
    return {
      title: '시설 회원 승인이 거절되었습니다.',
      description: '자세한 내용은 고객센터로 문의해 주세요.',
      action: (
        <Link to="/support" className={cn(buttonVariants({ variant: 'secondary' }))}>
          고객센터 문의
        </Link>
      ),
    }
  }

  // 구직자 / GUEST(유형 미선택)
  return {
    title: '시설 회원 전용 기능입니다.',
    description: '인재정보 열람은 승인된 시설 회원과 관리자만 이용할 수 있습니다.',
    action: (
      <Link to="/jobs" className={cn(buttonVariants({ variant: 'secondary' }))}>
        구인공고 보러 가기
      </Link>
    ),
  }
}
