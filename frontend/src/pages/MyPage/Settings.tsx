import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { FontSizeControl } from '@/components/layout/font-size-control'
import { withdrawMember } from '@/api/members'
import { useApp } from '@/hooks/use-app'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'

/** `/mypage/settings` — 화면 표시 설정(이미 서버 동기화됨) + 계정 정보 요약 + 회원 탈퇴. */
export function MyPageSettingsPage() {
  const { user, easyMode, setEasyMode, logout } = useApp()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  if (!user) return null

  async function handleWithdraw() {
    setWithdrawing(true)
    setWithdrawError(null)
    try {
      await withdrawMember(password || undefined)
      await logout()
      toast({ title: '탈퇴가 완료되었습니다.', description: '그동안 케어매치를 이용해 주셔서 감사합니다.' })
      navigate('/', { replace: true })
    } catch (err) {
      setWithdrawError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-fg">설정</h1>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-fg">계정 정보</h2>
        <dl className="mt-3 space-y-2 text-base">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">이름</dt>
            <dd className="text-fg">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">회원 유형</dt>
            <dd className="text-fg">
              {user.memberType === 'facility'
                ? '시설회원'
                : user.role === 'ADMIN'
                  ? '관리자'
                  : user.role === 'GENERAL'
                    ? '보호자회원'
                    : '구직회원'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">상태</dt>
            <dd className="text-fg">{user.subtitle}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-fg">화면 표시 설정</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1.5 text-base font-semibold text-fg">글자 크기</p>
            <FontSizeControl />
          </div>
          <Checkbox
            label="쉬운 화면 모드"
            checked={easyMode}
            onChange={(event) => setEasyMode(event.target.checked)}
          />
        </div>
      </section>

      {user.role === 'JOBSEEKER' && (
        <section className="rounded-card border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-fg">희망 근무조건</h2>
          <p className="mt-2 text-base text-fg-muted">
            구직 프로필(희망 직종·지역·근무조건)은 구직신청 화면에서 관리합니다.
          </p>
          <Link to="/apply" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-4 inline-flex')}>
            구직신청 화면으로
          </Link>
        </section>
      )}

      <section className="rounded-card border border-danger/30 bg-surface p-6">
        <h2 className="text-lg font-bold text-danger">회원 탈퇴</h2>
        <p className="mt-2 text-base text-fg-muted">
          탈퇴하면 로그인이 더 이상 되지 않고, 모든 기기에서 로그아웃됩니다.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4 border-danger/40 text-danger hover:bg-danger/10"
          onClick={() => {
            setPassword('')
            setWithdrawError(null)
            setWithdrawOpen(true)
          }}
        >
          회원 탈퇴
        </Button>
      </section>

      <Modal
        open={withdrawOpen}
        onClose={() => (withdrawing ? null : setWithdrawOpen(false))}
        title="회원 탈퇴"
        description="정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다."
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" disabled={withdrawing} onClick={() => setWithdrawOpen(false)}>
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={withdrawing}
              className="bg-danger text-white hover:bg-danger/90"
              onClick={handleWithdraw}
            >
              {withdrawing ? '처리 중…' : '탈퇴하기'}
            </Button>
          </>
        }
      >
        <label htmlFor="withdraw-password" className="mb-1.5 block text-sm font-semibold text-fg">
          비밀번호 확인
        </label>
        <Input
          id="withdraw-password"
          type="password"
          autoComplete="current-password"
          placeholder="소셜 로그인 계정은 비워두셔도 됩니다."
          value={password}
          disabled={withdrawing}
          onChange={(event) => setPassword(event.target.value)}
        />
        {withdrawError && (
          <p className="mt-2 text-sm text-danger" role="alert">
            {withdrawError}
          </p>
        )}
      </Modal>
    </div>
  )
}
