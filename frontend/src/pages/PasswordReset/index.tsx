import { Check } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useToast } from '@/components/ui/toast'
import { resetPassword } from '@/api/auth'
import { sendVerificationCode, verifyCode } from '@/api/verifications'
import { ApiError } from '@/lib/api-client'
import type { VerificationChannel } from '@/types/api'

/** 회원가입(Signup)과 동일한 비밀번호 정책 — 8~64자, 영문·숫자·특수문자 각 1자 이상 */
function passwordError(value: string) {
  if (value.length < 8 || value.length > 64) return '비밀번호는 8~64자로 입력해 주세요.'
  if (!/[a-zA-Z]/.test(value)) return '영문을 1자 이상 포함해 주세요.'
  if (!/[0-9]/.test(value)) return '숫자를 1자 이상 포함해 주세요.'
  if (!/[^a-zA-Z0-9]/.test(value)) return '특수문자를 1자 이상 포함해 주세요.'
  return null
}

/**
 * 비밀번호 찾기(재설정) — 회원가입과 동일한 인증코드 인프라(POST /api/verifications/send·verify)
 * 로 본인 확인 후 POST /api/auth/password-reset 으로 새 비밀번호를 설정한다.
 * 로그인 전 단계라 인증(토큰) 불필요.
 */
export function PasswordResetPage() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loginId, setLoginId] = useState('')
  const [channel, setChannel] = useState<VerificationChannel>('EMAIL')
  const [target, setTarget] = useState('')

  const [code, setCode] = useState('')
  const [codeSending, setCodeSending] = useState(false)
  const [codeVerifying, setCodeVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verifiedTarget, setVerifiedTarget] = useState<string | null>(null)
  const verified = verifiedTarget !== null && verifiedTarget === target.trim()

  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function clearError(key: string) {
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function resetVerificationState() {
    setCodeSent(false)
    setCode('')
    setVerifiedTarget(null)
    clearError('verification')
  }

  async function handleSendCode() {
    if (!target.trim()) {
      setErrors((prev) => ({
        ...prev,
        verification: channel === 'EMAIL' ? '이메일을 입력해 주세요.' : '휴대폰 번호를 입력해 주세요.',
      }))
      return
    }
    clearError('verification')
    setCodeSending(true)
    try {
      const res = await sendVerificationCode({ channel, target: target.trim() })
      setCodeSent(true)
      toast({
        title: '인증코드를 발송했습니다.',
        description: res.devCodeHint
          ? `개발 환경 인증코드: ${res.devCodeHint}`
          : `${target.trim()} 로 발송했습니다.`,
      })
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        verification: err instanceof ApiError ? err.message : '인증코드 발송에 실패했습니다.',
      }))
    } finally {
      setCodeSending(false)
    }
  }

  async function handleVerifyCode() {
    if (!code.trim()) {
      setErrors((prev) => ({ ...prev, verification: '인증번호를 입력해 주세요.' }))
      return
    }
    clearError('verification')
    setCodeVerifying(true)
    try {
      const res = await verifyCode({ channel, target: target.trim(), code: code.trim() })
      if (res.verified) {
        setVerifiedTarget(target.trim())
        toast({ title: '본인인증이 완료되었습니다.' })
      } else {
        setVerifiedTarget(null)
        setErrors((prev) => ({ ...prev, verification: '인증번호가 올바르지 않습니다.' }))
      }
    } catch (err) {
      setVerifiedTarget(null)
      setErrors((prev) => ({
        ...prev,
        verification: err instanceof ApiError ? err.message : '인증에 실패했습니다.',
      }))
    } finally {
      setCodeVerifying(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (!loginId.trim()) nextErrors.loginId = '아이디를 입력해 주세요.'
    if (!verified) nextErrors.verification = '본인인증을 먼저 완료해 주세요.'
    const pwErr = passwordError(newPassword)
    if (pwErr) nextErrors.newPassword = pwErr
    else if (newPassword !== newPasswordConfirm) nextErrors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await resetPassword({
        loginId: loginId.trim(),
        verificationChannel: channel,
        verificationTarget: target.trim(),
        newPassword,
      })
      setDone(true)
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: err instanceof ApiError ? err.message : '비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="container-page">
        <div className="mx-auto w-full max-w-[420px] py-16 text-center">
          <h1 className="text-2xl font-bold text-fg">비밀번호가 변경되었습니다</h1>
          <p className="mt-3 text-base text-fg-muted">
            새 비밀번호로 다시 로그인해 주세요. 기존에 로그인해 둔 다른 기기는 모두 로그아웃됩니다.
          </p>
          <Button block size="lg" className="mt-8" onClick={() => navigate('/login', { replace: true })}>
            로그인하러 가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page">
      <div className="mx-auto w-full max-w-[420px] py-10">
        <h1 className="text-2xl font-bold text-fg">비밀번호 찾기</h1>
        <p className="mt-2 text-base text-fg-muted">
          가입하신 아이디와 이메일(또는 휴대폰) 인증으로 비밀번호를 다시 설정할 수 있어요.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <Field label="아이디" htmlFor="loginId" required error={errors.loginId}>
            <Input
              id="loginId"
              name="loginId"
              autoComplete="username"
              value={loginId}
              invalid={Boolean(errors.loginId)}
              onChange={(e) => {
                setLoginId(e.target.value)
                clearError('loginId')
              }}
            />
          </Field>

          <Field label="본인인증" required error={errors.verification}>
            <SegmentedControl
              items={[
                { value: 'EMAIL', label: '이메일' },
                { value: 'PHONE', label: '휴대폰' },
              ]}
              value={channel}
              onChange={(value) => {
                setChannel(value)
                resetVerificationState()
              }}
            />

            <Input
              className="mt-2"
              aria-label={channel === 'EMAIL' ? '이메일' : '휴대폰 번호'}
              placeholder={channel === 'EMAIL' ? '가입 시 등록한 이메일' : '가입 시 등록한 휴대폰 번호'}
              value={target}
              disabled={verified}
              onChange={(e) => {
                setTarget(e.target.value)
                resetVerificationState()
              }}
            />

            <div className="mt-2 flex gap-2">
              <Input
                aria-label="인증번호"
                inputMode="numeric"
                placeholder="인증번호 6자리"
                value={code}
                disabled={verified}
                invalid={Boolean(errors.verification)}
                onChange={(e) => {
                  setCode(e.target.value)
                  clearError('verification')
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                disabled={codeSending || verified}
                onClick={handleSendCode}
              >
                {codeSending ? '발송 중…' : codeSent ? '재발송' : '코드 발송'}
              </Button>
              <Button
                type="button"
                className="shrink-0"
                disabled={codeVerifying || verified || !codeSent}
                onClick={handleVerifyCode}
              >
                {codeVerifying ? '확인 중…' : '인증 확인'}
              </Button>
            </div>

            {verified && (
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary-deep">
                <Check className="size-4" aria-hidden />
                본인인증이 완료되었습니다.
              </p>
            )}
          </Field>

          <Field label="새 비밀번호" htmlFor="newPassword" required error={errors.newPassword}>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              invalid={Boolean(errors.newPassword)}
              onChange={(e) => {
                setNewPassword(e.target.value)
                clearError('newPassword')
              }}
            />
            <p className="mt-1.5 text-sm text-fg-subtle">8~64자, 영문·숫자·특수문자를 모두 포함해 주세요.</p>
          </Field>

          <Field label="새 비밀번호 확인" htmlFor="newPasswordConfirm" required error={errors.newPasswordConfirm}>
            <Input
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              type="password"
              autoComplete="new-password"
              value={newPasswordConfirm}
              invalid={Boolean(errors.newPasswordConfirm)}
              onChange={(e) => {
                setNewPasswordConfirm(e.target.value)
                clearError('newPasswordConfirm')
              }}
            />
          </Field>

          {errors.form && (
            <p className="text-sm text-danger" role="alert">
              {errors.form}
            </p>
          )}

          <Button type="submit" block size="lg" disabled={submitting}>
            {submitting ? '변경 중…' : '비밀번호 재설정'}
          </Button>
        </form>

        <p className="mt-8 text-center text-base text-fg-muted">
          비밀번호가 기억나셨나요?{' '}
          <Link to="/login" className="font-semibold text-primary-deep hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-base font-semibold text-fg">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
