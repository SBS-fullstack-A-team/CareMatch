import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/hooks/use-app'
import { API_BASE_URL, ApiError } from '@/lib/api-client'

const SOCIAL = [
  { key: 'kakao', label: '카카오로 시작하기' },
  { key: 'naver', label: '네이버로 시작하기' },
  { key: 'google', label: 'Google로 시작하기' },
] as const

/**
 * 로그인 화면 — API 연동 참조 구현.
 * 폼 상태는 useState (공유 Input 컴포넌트가 아직 forwardRef 가 아니라 react-hook-form 은 보류).
 */
export function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!loginId.trim() || !password) {
      setError('아이디와 비밀번호를 모두 입력해 주세요.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await login(loginId.trim(), password)
      navigate(res.roleSelected ? redirectTo : '/oauth/select-role', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-page">
      <div className="mx-auto w-full max-w-[420px] py-10">
        <h1 className="text-2xl font-bold text-fg">로그인</h1>
        <p className="mt-2 text-base text-fg-muted">케어매치 계정으로 로그인하세요.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="loginId" className="mb-1.5 block text-base font-semibold text-fg">
              아이디
            </label>
            <Input
              id="loginId"
              name="loginId"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              invalid={Boolean(error)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-base font-semibold text-fg">
              비밀번호
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={Boolean(error)}
            />
          </div>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" block size="lg" disabled={submitting}>
            {submitting ? '로그인 중…' : '로그인'}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-sm text-fg-subtle">
          <span className="h-px flex-1 bg-border" />
          또는
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-6 space-y-2">
          {SOCIAL.map((s) => (
            <Button
              key={s.key}
              variant="secondary"
              block
              size="lg"
              onClick={() => {
                window.location.href = `${API_BASE_URL}/oauth2/authorization/${s.key}`
              }}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <p className="mt-8 text-center text-base text-fg-muted">
          아직 회원이 아니신가요?{' '}
          <Link to="/signup" className="font-semibold text-primary-deep hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
