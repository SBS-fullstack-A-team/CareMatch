import { Check, Info } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useToast } from '@/components/ui/toast'
import { checkExists, signupJobSeeker } from '@/api/members'
import { getTerms, getTermsDetail } from '@/api/terms'
import { sendVerificationCode, verifyCode } from '@/api/verifications'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type {
  TermsResponse,
  TermsTypeName,
  VerificationChannel,
} from '@/types/api'

type MemberKind = 'personal' | 'facility'
type CheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

/**
 * 필수 약관은 서버의 TermsType enum(SERVICE·PRIVACY = required)이 강제한다.
 * GET /api/terms 의 `required` 는 DB 시드값이라 현재 SERVICE/PRIVACY 도 false 로 내려와
 * 신뢰할 수 없어, 화면에서는 이 목록을 기준으로 필수 여부를 판단한다.
 */
const REQUIRED_TERMS: TermsTypeName[] = ['SERVICE', 'PRIVACY']

/**
 * 서버 fieldErrors 의 필드명을 화면 필드 키로 옮긴다.
 * 나머지(loginId·password·email·name·phone·residence)는 이름이 같아 그대로 쓴다.
 */
const SERVER_FIELD_MAP: Record<string, string> = {
  verificationChannel: 'verification',
  verificationTarget: 'verification',
  agreements: 'terms',
}

/** 백엔드 JobSeekerSignupRequest / PasswordPolicy 와 동일한 규칙 */
const LOGIN_ID_RE = /^[a-zA-Z0-9_]{4,20}$/
const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function passwordError(value: string) {
  if (value.length < 8 || value.length > 64) return '비밀번호는 8~64자로 입력해 주세요.'
  if (!/[a-zA-Z]/.test(value)) return '영문을 1자 이상 포함해 주세요.'
  if (!/[0-9]/.test(value)) return '숫자를 1자 이상 포함해 주세요.'
  if (!/[^a-zA-Z0-9]/.test(value)) return '특수문자를 1자 이상 포함해 주세요.'
  return null
}

/**
 * 회원가입 (/signup) — 개인회원(구직자)
 *
 * 실제 백엔드에 연결된다.
 *   POST /api/members/jobseekers · GET /api/members/exists
 *   POST /api/verifications/send · /verify · GET /api/terms
 *
 * 가입 성공 시 서버가 토큰을 주지 않으므로 자동 로그인은 하지 않는다.
 * 폼 상태는 Login 화면과 동일하게 useState 로 관리한다.
 */
export function SignupPage() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [memberKind, setMemberKind] = useState<MemberKind>('personal')

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [residence, setResidence] = useState('')

  const [loginIdStatus, setLoginIdStatus] = useState<CheckStatus>('idle')
  const [emailStatus, setEmailStatus] = useState<CheckStatus>('idle')

  const [channel, setChannel] = useState<VerificationChannel>('EMAIL')
  const [code, setCode] = useState('')
  const [codeSending, setCodeSending] = useState(false)
  const [codeVerifying, setCodeVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  /** 인증이 끝난 대상. 값이 바뀌면 인증을 무효화한다 */
  const [verifiedTarget, setVerifiedTarget] = useState<string | null>(null)

  const [terms, setTerms] = useState<TermsResponse[]>([])
  const [termsLoadFailed, setTermsLoadFailed] = useState(false)
  const [agreed, setAgreed] = useState<Record<string, boolean>>({})
  const [termsDetail, setTermsDetail] = useState<TermsResponse | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  /** 인증 대상은 선택한 채널에 따라 이메일/휴대폰 입력값을 그대로 쓴다 */
  const verificationTarget = channel === 'EMAIL' ? email.trim() : phone.trim()
  const verified = verifiedTarget !== null && verifiedTarget === verificationTarget

  const loadTerms = useCallback(() => {
    setTermsLoadFailed(false)
    getTerms()
      .then((list) => {
        setTerms(list)
        setTermsLoadFailed(false)
      })
      .catch(() => setTermsLoadFailed(true))
  }, [])

  useEffect(loadTerms, [loadTerms])

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })

  // ---------------- 중복 확인 ----------------
  const runCheck = async (field: 'loginId' | 'email') => {
    const value = field === 'loginId' ? loginId.trim() : email.trim()
    const setStatus = field === 'loginId' ? setLoginIdStatus : setEmailStatus

    const localError =
      field === 'loginId'
        ? LOGIN_ID_RE.test(value)
          ? null
          : '아이디는 영문·숫자·밑줄 4~20자로 입력해 주세요.'
        : EMAIL_RE.test(value)
          ? null
          : '이메일 형식이 올바르지 않습니다.'

    if (localError) {
      setErrors((prev) => ({ ...prev, [field]: localError }))
      setStatus('idle')
      return
    }

    setStatus('checking')
    clearError(field)
    try {
      const res = await checkExists({ [field]: value })
      const available = field === 'loginId' ? res.loginIdAvailable : res.emailAvailable
      setStatus(available ? 'available' : 'taken')
    } catch (err) {
      setStatus('error')
      setErrors((prev) => ({
        ...prev,
        [field]:
          err instanceof ApiError ? err.message : '중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      }))
    }
  }

  // ---------------- 본인인증 ----------------
  const handleSendCode = async () => {
    if (!verificationTarget) {
      setErrors((prev) => ({
        ...prev,
        verification:
          channel === 'EMAIL' ? '이메일을 먼저 입력해 주세요.' : '휴대폰 번호를 먼저 입력해 주세요.',
      }))
      return
    }
    clearError('verification')
    setCodeSending(true)
    try {
      const res = await sendVerificationCode({ channel, target: verificationTarget })
      setCodeSent(true)
      toast({
        title: '인증코드를 발송했습니다.',
        description: res.devCodeHint
          ? `개발 환경 인증코드: ${res.devCodeHint}`
          : `${verificationTarget} 로 발송했습니다.`,
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

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setErrors((prev) => ({ ...prev, verification: '인증번호를 입력해 주세요.' }))
      return
    }
    clearError('verification')
    setCodeVerifying(true)
    try {
      const res = await verifyCode({ channel, target: verificationTarget, code: code.trim() })
      if (res.verified) {
        setVerifiedTarget(verificationTarget)
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

  // ---------------- 약관 ----------------
  const requiredTerms = terms.filter((item) => REQUIRED_TERMS.includes(item.type))
  const allAgreed = terms.length > 0 && terms.every((item) => agreed[item.type])
  const toggleAll = (value: boolean) =>
    setAgreed(Object.fromEntries(terms.map((item) => [item.type, value])))

  const openTermsDetail = async (type: TermsTypeName) => {
    try {
      setTermsDetail(await getTermsDetail(type))
    } catch {
      toast({ variant: 'error', title: '약관 내용을 불러오지 못했습니다.' })
    }
  }

  // ---------------- 제출 ----------------
  const validate = () => {
    const next: Record<string, string> = {}

    if (!LOGIN_ID_RE.test(loginId.trim())) {
      next.loginId = '아이디는 영문·숫자·밑줄 4~20자로 입력해 주세요.'
    } else if (loginIdStatus !== 'available') {
      next.loginId = '아이디 중복 확인을 해주세요.'
    }

    const pwError = passwordError(password)
    if (pwError) next.password = pwError
    if (password !== passwordConfirm) next.passwordConfirm = '비밀번호가 일치하지 않습니다.'

    if (!EMAIL_RE.test(email.trim())) {
      next.email = '이메일 형식이 올바르지 않습니다.'
    } else if (emailStatus !== 'available') {
      next.email = '이메일 중복 확인을 해주세요.'
    }

    if (!name.trim()) next.name = '이름을 입력해 주세요.'
    else if (name.trim().length > 50) next.name = '이름은 50자 이하로 입력해 주세요.'

    if (!PHONE_RE.test(phone.trim())) next.phone = '휴대폰 번호 형식이 올바르지 않습니다.'
    if (residence.trim().length > 200) next.residence = '거주지는 200자 이하로 입력해 주세요.'

    if (!verified) next.verification = '본인인증을 완료해 주세요.'

    if (terms.length === 0) {
      next.terms = '약관을 불러오지 못했습니다. 다시 시도해 주세요.'
    } else if (requiredTerms.some((item) => !agreed[item.type])) {
      next.terms = '필수 약관에 모두 동의해 주세요.'
    }

    return next
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (memberKind === 'facility') {
      setFormError('시설회원 가입은 아직 준비 중입니다. 개인회원으로 가입해 주세요.')
      return
    }

    const nextErrors = validate()
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.scrollIntoView({ block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      const res = await signupJobSeeker({
        loginId: loginId.trim(),
        password,
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        residence: residence.trim() || undefined,
        verificationChannel: channel,
        verificationTarget,
        // 미동의(마케팅)도 서버가 false 레코드로 기록하므로 3종 모두 보낸다
        agreements: terms.map((item) => ({
          type: item.type,
          version: item.version,
          agreed: Boolean(agreed[item.type]),
        })),
      })
      setDone(res.message)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.length > 0) {
          const mapped = err.fieldErrors.map((item) => ({
            field: SERVER_FIELD_MAP[item.field] ?? item.field,
            reason: item.reason,
          }))
          setErrors(Object.fromEntries(mapped.map((item) => [item.field, item.reason])))
          document
            .getElementById(`field-${mapped[0].field}`)
            ?.scrollIntoView({ block: 'center' })
        }
        setFormError(err.message)
      } else {
        setFormError('회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-page">
      <div className="mx-auto w-full max-w-[520px] py-10">
        <h1 className="text-2xl font-bold text-fg">회원가입</h1>
        <p className="mt-2 text-base text-fg-muted">
          케어매치 계정을 만들고 나에게 맞는 일자리를 찾아보세요.
        </p>

        {/* ---------------- 회원 유형 ---------------- */}
        <div className="mt-8">
          <p className="mb-1.5 text-base font-semibold text-fg">회원 유형</p>
          <SegmentedControl
            items={[
              { value: 'personal', label: '개인회원' },
              { value: 'facility', label: '시설회원' },
            ]}
            value={memberKind}
            onChange={(value) => {
              setMemberKind(value)
              setFormError(null)
            }}
            size="lg"
          />
        </div>

        {memberKind === 'facility' ? (
          <div className="mt-5 flex gap-2.5 rounded-card border border-border bg-surface px-5 py-4">
            <Info className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
            <div>
              <p className="text-base font-semibold text-fg">
                시설회원 가입은 아직 준비 중입니다.
              </p>
              <p className="mt-1 text-base text-fg-muted">
                사업자등록증 확인 절차가 필요해 다음 단계에서 제공될 예정입니다. 지금은 개인회원으로
                가입할 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            {/* 아이디 */}
            <Field label="아이디" htmlFor="loginId" required error={errors.loginId}>
              <div className="flex gap-2">
                <Input
                  id="loginId"
                  autoComplete="username"
                  placeholder="영문·숫자·밑줄 4~20자"
                  value={loginId}
                  invalid={Boolean(errors.loginId)}
                  onChange={(event) => {
                    setLoginId(event.target.value)
                    setLoginIdStatus('idle')
                    clearError('loginId')
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={loginIdStatus === 'checking'}
                  onClick={() => runCheck('loginId')}
                >
                  {loginIdStatus === 'checking' ? '확인 중…' : '중복 확인'}
                </Button>
              </div>
              <CheckHint status={loginIdStatus} okText="사용할 수 있는 아이디입니다." takenText="이미 사용 중인 아이디입니다." />
            </Field>

            {/* 비밀번호 */}
            <Field label="비밀번호" htmlFor="password" required error={errors.password}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="영문·숫자·특수문자 조합 8자 이상"
                value={password}
                invalid={Boolean(errors.password)}
                onChange={(event) => {
                  setPassword(event.target.value)
                  clearError('password')
                }}
              />
            </Field>

            <Field
              label="비밀번호 확인"
              htmlFor="passwordConfirm"
              required
              error={errors.passwordConfirm}
            >
              <Input
                id="passwordConfirm"
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력해 주세요"
                value={passwordConfirm}
                invalid={Boolean(errors.passwordConfirm)}
                onChange={(event) => {
                  setPasswordConfirm(event.target.value)
                  clearError('passwordConfirm')
                }}
              />
            </Field>

            {/* 이메일 */}
            <Field label="이메일" htmlFor="email" required error={errors.email}>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@carematch.co.kr"
                  value={email}
                  invalid={Boolean(errors.email)}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setEmailStatus('idle')
                    clearError('email')
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={emailStatus === 'checking'}
                  onClick={() => runCheck('email')}
                >
                  {emailStatus === 'checking' ? '확인 중…' : '중복 확인'}
                </Button>
              </div>
              <CheckHint status={emailStatus} okText="사용할 수 있는 이메일입니다." takenText="이미 가입된 이메일입니다." />
            </Field>

            {/* 이름 / 휴대폰 / 거주지 */}
            <Field label="이름" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                autoComplete="name"
                placeholder="홍길동"
                maxLength={50}
                value={name}
                invalid={Boolean(errors.name)}
                onChange={(event) => {
                  setName(event.target.value)
                  clearError('name')
                }}
              />
            </Field>

            <Field label="휴대폰 번호" htmlFor="phone" required error={errors.phone}>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="010-1234-5678"
                value={phone}
                invalid={Boolean(errors.phone)}
                onChange={(event) => {
                  setPhone(event.target.value)
                  clearError('phone')
                }}
              />
            </Field>

            <Field label="거주지" htmlFor="residence" error={errors.residence}>
              <Input
                id="residence"
                autoComplete="address-level2"
                placeholder="서울특별시 강남구 (선택)"
                maxLength={200}
                value={residence}
                invalid={Boolean(errors.residence)}
                onChange={(event) => {
                  setResidence(event.target.value)
                  clearError('residence')
                }}
              />
            </Field>

            {/* ---------------- 본인인증 ---------------- */}
            <Field label="본인인증" required error={errors.verification}>
              <SegmentedControl
                items={[
                  { value: 'EMAIL', label: '이메일' },
                  { value: 'PHONE', label: '휴대폰' },
                ]}
                value={channel}
                onChange={(value) => {
                  setChannel(value)
                  setCodeSent(false)
                  setCode('')
                  clearError('verification')
                }}
              />

              <p className="mt-2 text-sm text-fg-muted">
                {verificationTarget
                  ? `${verificationTarget} 로 인증코드를 보냅니다.`
                  : channel === 'EMAIL'
                    ? '위에 입력한 이메일로 인증코드를 보냅니다.'
                    : '위에 입력한 휴대폰 번호로 인증코드를 보냅니다.'}
              </p>

              <div className="mt-2 flex gap-2">
                <Input
                  aria-label="인증번호"
                  inputMode="numeric"
                  placeholder="인증번호 6자리"
                  value={code}
                  disabled={verified}
                  invalid={Boolean(errors.verification)}
                  onChange={(event) => {
                    setCode(event.target.value)
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

            {/* ---------------- 약관 ---------------- */}
            <div id="field-terms">
              <p className="mb-1.5 text-base font-semibold text-fg">
                약관 동의
                <span className="ml-1 text-danger">*</span>
              </p>

              {termsLoadFailed ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-4">
                  <p className="text-base text-fg-muted">약관을 불러오지 못했습니다.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={loadTerms}>
                    다시 시도
                  </Button>
                </div>
              ) : (
              <div className="rounded-card border border-border bg-surface px-4 py-2">
                <Checkbox
                  label={<span className="font-semibold">전체 동의</span>}
                  checked={allAgreed}
                  onChange={(event) => toggleAll(event.target.checked)}
                />

                <div className="mt-1 border-t border-border pt-1">
                  {terms.map((item) => {
                    const required = REQUIRED_TERMS.includes(item.type)
                    return (
                      <div key={item.type} className="flex items-center gap-2">
                        <Checkbox
                          className="flex-1"
                          label={
                            <span>
                              <span className={required ? 'text-danger' : 'text-fg-muted'}>
                                [{required ? '필수' : '선택'}]
                              </span>{' '}
                              {item.title}
                            </span>
                          }
                          checked={Boolean(agreed[item.type])}
                          onChange={(event) => {
                            setAgreed((prev) => ({ ...prev, [item.type]: event.target.checked }))
                            clearError('terms')
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => openTermsDetail(item.type)}
                          className="shrink-0 text-sm text-fg-muted underline underline-offset-4 hover:text-primary-deep"
                        >
                          보기
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
              )}

              {errors.terms && (
                <p className="mt-2 text-sm text-danger" role="alert">
                  {errors.terms}
                </p>
              )}
            </div>

            {formError && (
              <p className="text-sm text-danger" role="alert">
                {formError}
              </p>
            )}

            <Button type="submit" block size="lg" disabled={submitting}>
              {submitting ? '가입 중…' : '회원가입'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-base text-fg-muted">
          이미 회원이신가요?{' '}
          <Link to="/login" className="font-semibold text-primary-deep hover:underline">
            로그인
          </Link>
        </p>
      </div>

      {/* 약관 본문 */}
      <Modal
        open={termsDetail !== null}
        onClose={() => setTermsDetail(null)}
        title={termsDetail?.title ?? ''}
        description={termsDetail ? `버전 ${termsDetail.version}` : undefined}
        size="md"
      >
        <p className="text-base leading-relaxed whitespace-pre-line text-fg-muted">
          {termsDetail?.content ?? '약관 내용이 없습니다.'}
        </p>
      </Modal>

      {/* 가입 완료 */}
      <Modal
        open={done !== null}
        onClose={() => setDone(null)}
        title="회원가입이 완료되었습니다."
        description={done ?? undefined}
        size="sm"
        footer={
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
            onClick={() => navigate('/login', { replace: true })}
          >
            로그인하러 가기
          </button>
        }
      >
        <p className="text-base text-fg-muted">
          가입하신 아이디로 로그인하면 서비스를 이용할 수 있습니다.
        </p>
      </Modal>
    </div>
  )
}

/** 라벨 + 필수 표시 + 에러. Login 화면의 라벨/에러 표기를 그대로 따른다. */
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
    <div id={htmlFor ? `field-${htmlFor}` : `field-verification`}>
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

/** 중복 확인 결과 */
function CheckHint({
  status,
  okText,
  takenText,
}: {
  status: CheckStatus
  okText: string
  takenText: string
}) {
  if (status === 'available') {
    return (
      <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary-deep">
        <Check className="size-4" aria-hidden />
        {okText}
      </p>
    )
  }
  if (status === 'taken') {
    return (
      <p className="mt-2 text-sm text-danger" role="alert">
        {takenText}
      </p>
    )
  }
  return null
}
