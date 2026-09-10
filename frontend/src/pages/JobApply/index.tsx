import { Award, Check, ClipboardList, FileText, LogIn, Minus, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DetailSection } from '@/components/common/detail-section'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { TalentListCard } from '@/components/talent/talent-list-card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
  CATEGORY_OPTIONS,
  CERTIFICATE_OPTIONS,
  DISTRICT_OPTIONS,
  PAY_TYPE_OPTIONS,
  SIDO_OPTIONS,
  WORK_SCHEDULE_OPTIONS,
} from '@/data/filters'
import { useApp } from '@/hooks/use-app'
import { cn, formatPay, type PayType } from '@/lib/utils'
import type { Talent } from '@/types'
import {
  clearDraft,
  EMPTY_DRAFT,
  loadDraft,
  saveDraft,
  validateDraft,
  type JobApplyDraft,
  type RequiredField,
} from './draft'

/**
 * 구직신청 (/apply)
 *
 * "내 구직 프로필 등록/수정" 화면이다. 특정 공고 지원(`POST /api/job-postings/{id}/applications`)은
 * 성격이 달라 이 화면에서 다루지 않으며, jobId 쿼리도 읽지 않는다.
 *
 * 저장 API 가 아직 연결되지 않아 등록은 화면 상의 완료 처리까지만 한다.
 * 임시저장은 localStorage 로 실제 동작한다.
 * 폼 상태는 Login 화면과 같이 useState 로 관리한다 (공유 UI 가 forwardRef 가 아니라 RHF 미사용).
 */
export function JobApplyPage() {
  const { user, authReady } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<JobApplyDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<Partial<Record<RequiredField, string>>>({})
  const [restored, setRestored] = useState(false)
  const [done, setDone] = useState(false)

  /** 임시저장 복원 — 새로고침해도 이어서 작성할 수 있다 */
  useEffect(() => {
    const saved = loadDraft()
    if (saved) {
      setDraft(saved)
      setRestored(true)
    }
  }, [])

  const update = (patch: Partial<JobApplyDraft>) => setDraft((prev) => ({ ...prev, ...patch }))

  /**
   * 이미 표시된 에러는 값이 채워지는 즉시 지운다.
   * 아직 건드리지 않은 필드에 새 에러를 미리 띄우지는 않는다.
   */
  useEffect(() => {
    setErrors((prev) => {
      const shown = Object.keys(prev) as RequiredField[]
      if (shown.length === 0) return prev
      const remaining = validateDraft(draft)
      const next: Partial<Record<RequiredField, string>> = {}
      shown.forEach((key) => {
        if (remaining[key]) next[key] = remaining[key]
      })
      return Object.keys(next).length === shown.length ? prev : next
    })
  }, [draft])

  const districts = DISTRICT_OPTIONS[draft.sido] ?? []

  const toggleCertificate = (value: string) =>
    update({
      certificates: draft.certificates.includes(value)
        ? draft.certificates.filter((item) => item !== value)
        : [...draft.certificates, value],
    })

  /** 미리보기 — 카드가 채워질 만큼 입력됐을 때만 만든다 (빈 값을 임의로 채우지 않는다) */
  const previewTalent = useMemo<Talent | null>(() => {
    if (!draft.category || !draft.sido || !draft.workSchedule) return null
    if (!draft.gender || !draft.age) return null

    const region = draft.district ? `${shortSido(draft.sido)} ${draft.district}` : shortSido(draft.sido)

    return {
      id: 'preview',
      name: user?.name ?? '회원',
      gender: draft.gender,
      age: Number(draft.age),
      category: draft.category as Talent['category'],
      regions: [region],
      certificates: draft.certificates,
      updatedAt: new Date().toISOString().slice(0, 10),
      careerLabel: careerLabelOf(draft),
      careerYears: draft.hasCareer === 'yes' ? Number(draft.careerYears || 0) : 0,
      workSchedule: draft.workSchedule as Talent['workSchedule'],
      preferredHours: draft.preferredHours || undefined,
      payType: (draft.payType || undefined) as PayType | undefined,
      payAmount: draft.payAmount ? Number(draft.payAmount) : undefined,
      summary: draft.summary || undefined,
      availableNow: draft.availableNow,
    }
  }, [draft, user?.name])

  const handleSaveDraft = () => {
    if (saveDraft(draft)) {
      toast({ title: '임시저장했습니다.', description: '나중에 이어서 작성할 수 있어요.' })
    } else {
      toast({ variant: 'error', title: '임시저장에 실패했습니다.' })
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)

    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.scrollIntoView({ block: 'center' })
      return
    }

    saveDraft(draft)
    setDone(true)
  }

  /** 완료 후 "맞춤 일자리 보기" — JobListPage 가 실제로 읽는 파라미터만 넘긴다 */
  const matchedJobsHref = useMemo(() => {
    const params = new URLSearchParams()
    if (draft.sido) params.set('sido', draft.sido)
    if (draft.district) params.set('district', draft.district)
    if (draft.category) params.set('category', draft.category)
    return `/jobs?${params.toString()}`
  }, [draft.sido, draft.district, draft.category])

  // ---------------- 세션 확인 ----------------
  if (!authReady) {
    return (
      <div className="container-page py-10">
        <LoadingState rows={2} />
      </div>
    )
  }

  if (!user) return <LoginRequired />

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb items={[{ label: '홈', to: '/' }, { label: '구직신청' }]} />

      <header className="mt-3">
        <h1 className="text-3xl font-bold text-fg">구직신청</h1>
        <p className="mt-2 text-base text-fg-muted">
          원하는 조건을 등록하면 나에게 맞는 일자리를 더 쉽게 찾을 수 있어요.
        </p>
      </header>

      {restored && (
        <p className="mt-4 rounded-card border border-border bg-surface px-4 py-3 text-base text-fg-muted">
          임시저장한 내용을 불러왔습니다.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 gap-6 lg:flex lg:items-start">
        {/* ---------------- 본문 ---------------- */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* ① 기본 정보 */}
          <DetailSection title="기본 정보" icon={UserRound}>
            <p className="-mt-2 mb-5 text-base text-fg-muted">
              인재정보에 표시되는 기본 정보입니다. 이름은 회원정보의 이름이 사용됩니다.
            </p>

            <div className="space-y-5">
              <Field label="성별">
                <SegmentedControl
                  items={[
                    { value: '여', label: '여성' },
                    { value: '남', label: '남성' },
                  ]}
                  value={draft.gender}
                  onChange={(value) => update({ gender: value })}
                />
              </Field>

              <Field label="나이" htmlFor="age" width="sm">
                <div className="flex items-center gap-2">
                  <Input
                    id="age"
                    type="number"
                    min={19}
                    max={99}
                    inputMode="numeric"
                    placeholder="예) 52"
                    value={draft.age}
                    onChange={(event) => update({ age: event.target.value })}
                  />
                  <span className="shrink-0 text-base text-fg-muted">세</span>
                </div>
              </Field>
            </div>
          </DetailSection>

          {/* ② 희망 근무조건 */}
          <DetailSection title="희망 근무조건" icon={ClipboardList}>
            <div className="space-y-5">
              <Field label="희망 직종" htmlFor="category" required error={errors.category} width="md">
                <Select
                  id="category"
                  placeholder="직종을 선택하세요"
                  options={CATEGORY_OPTIONS}
                  value={draft.category}
                  invalid={Boolean(errors.category)}
                  onChange={(event) => update({ category: event.target.value })}
                />
              </Field>

              <Field label="희망 지역" htmlFor="sido" required error={errors.sido}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    id="sido"
                    placeholder="시·도 선택"
                    options={SIDO_OPTIONS}
                    value={draft.sido}
                    invalid={Boolean(errors.sido)}
                    onChange={(event) => update({ sido: event.target.value, district: '' })}
                  />
                  <Select
                    aria-label="구·군"
                    placeholder={draft.sido ? '구·군 선택 (선택)' : '시·도 먼저 선택'}
                    options={districts}
                    value={draft.district}
                    disabled={districts.length === 0}
                    onChange={(event) => update({ district: event.target.value })}
                  />
                </div>
              </Field>

              <Field label="근무 시간대" required error={errors.workSchedule}>
                <SegmentedControl
                  items={WORK_SCHEDULE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={draft.workSchedule}
                  onChange={(value) => update({ workSchedule: value })}
                />
              </Field>

              <Field label="희망 근무시간" htmlFor="preferredHours">
                <Input
                  id="preferredHours"
                  placeholder="예) 평일 오전 (09:00 ~ 13:00)"
                  value={draft.preferredHours}
                  onChange={(event) => update({ preferredHours: event.target.value })}
                />
              </Field>

              <Field label="희망 급여" htmlFor="payType">
                <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <Select
                    id="payType"
                    placeholder="급여 형태"
                    options={PAY_TYPE_OPTIONS}
                    value={draft.payType}
                    onChange={(event) =>
                      update({ payType: event.target.value as JobApplyDraft['payType'] })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="희망 급여 금액"
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      placeholder="예) 2500000"
                      value={draft.payAmount}
                      onChange={(event) => update({ payAmount: event.target.value })}
                    />
                    <span className="shrink-0 text-base text-fg-muted">원</span>
                  </div>
                </div>
                {draft.payType && draft.payAmount && (
                  <p className="mt-2 text-sm text-fg-muted">
                    인재정보에는{' '}
                    <strong className="font-semibold text-fg">
                      {formatPay(draft.payType, Number(draft.payAmount))}
                    </strong>
                    으로 표시됩니다.
                  </p>
                )}
              </Field>
            </div>
          </DetailSection>

          {/* ③ 경력 및 자격 */}
          <DetailSection title="경력 및 자격" icon={Award}>
            <div className="space-y-5">
              <Field label="경력 여부">
                <SegmentedControl
                  items={[
                    { value: 'yes', label: '경력 있음' },
                    { value: 'no', label: '신입' },
                  ]}
                  value={draft.hasCareer}
                  onChange={(value) =>
                    update({ hasCareer: value, careerYears: value === 'no' ? '' : draft.careerYears })
                  }
                />
              </Field>

              <Field label="경력 연수" htmlFor="careerYears" width="sm">
                <div className="flex items-center gap-2">
                  <Input
                    id="careerYears"
                    type="number"
                    min={0}
                    max={50}
                    inputMode="numeric"
                    placeholder="예) 7"
                    value={draft.careerYears}
                    disabled={draft.hasCareer !== 'yes'}
                    onChange={(event) => update({ careerYears: event.target.value })}
                  />
                  <span className="shrink-0 text-base text-fg-muted">년</span>
                </div>
                {draft.hasCareer === 'no' && (
                  <p className="mt-2 text-sm text-fg-muted">신입은 경력 연수를 입력하지 않습니다.</p>
                )}
              </Field>

              <Field label="자격증">
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {CERTIFICATE_OPTIONS.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={draft.certificates.includes(option.value)}
                      onChange={() => toggleCertificate(option.value)}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </DetailSection>

          {/* ④ 자기소개 */}
          <DetailSection title="자기소개" icon={FileText}>
            <div className="space-y-5">
              <Field label="자기소개" htmlFor="summary">
                <Textarea
                  id="summary"
                  rows={6}
                  maxLength={500}
                  placeholder="자신의 경력이나 강점, 근무할 때 중요하게 생각하는 점을 자유롭게 작성해주세요."
                  value={draft.summary}
                  onChange={(event) => update({ summary: event.target.value })}
                />
                <p className="mt-2 text-sm text-fg-subtle tabular">{draft.summary.length} / 500</p>
              </Field>

              <Checkbox
                label="지금 바로 근무할 수 있어요"
                checked={draft.availableNow}
                onChange={(event) => update({ availableNow: event.target.checked })}
              />
            </div>
          </DetailSection>
        </div>

        {/* ---------------- 우측 ---------------- */}
        <aside className="mt-5 w-full space-y-5 lg:sticky lg:top-24 lg:mt-0 lg:w-[340px] lg:shrink-0">
          <section className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-fg">작성 상태</h2>
            <dl className="mt-4 space-y-0.5">
              <StatusRow label="희망 직종" filled={Boolean(draft.category)} required />
              <StatusRow label="희망 지역" filled={Boolean(draft.sido)} required />
              <StatusRow label="근무 시간대" filled={Boolean(draft.workSchedule)} required />
              <StatusRow label="기본 정보" filled={Boolean(draft.gender && draft.age)} />
              <StatusRow label="경력 및 자격" filled={Boolean(draft.hasCareer)} />
              <StatusRow label="자기소개" filled={Boolean(draft.summary)} />
            </dl>
          </section>

          <section className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-fg">인재정보 미리보기</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              등록하면 인재정보 목록에 이렇게 표시됩니다.
            </p>

            <div className="mt-4">
              {previewTalent ? (
                <TalentListCard talent={previewTalent} />
              ) : (
                <p className="rounded-card border border-dashed border-border-strong px-4 py-6 text-center text-base text-fg-muted">
                  성별·나이·희망 직종·희망 지역·근무 시간대를 입력하면
                  <br />
                  미리보기가 표시됩니다.
                </p>
              )}
            </div>
          </section>

          <div className="space-y-2">
            <Button type="submit" block>
              구직신청 등록
            </Button>
            <Button type="button" variant="secondary" block onClick={handleSaveDraft}>
              임시저장
            </Button>
          </div>
        </aside>
      </form>

      {/* ---------------- 등록 완료 ---------------- */}
      <Modal
        open={done}
        onClose={() => setDone(false)}
        title="구직 프로필이 작성되었습니다."
        description="아직 서버에 저장되는 단계는 아니며, 작성한 내용은 이 브라우저에만 보관됩니다."
        size="sm"
        footer={
          <>
            <Link
              to="/talents"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              onClick={() => setDone(false)}
            >
              인재정보 보기
            </Link>
            <button
              type="button"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
              onClick={() => {
                setDone(false)
                navigate(matchedJobsHref)
              }}
            >
              맞춤 일자리 보기
            </button>
          </>
        }
      >
        <p className="text-base text-fg-muted">
          작성한 희망조건으로 맞는 일자리를 바로 찾아볼 수 있습니다.
        </p>
        <button
          type="button"
          onClick={() => {
            clearDraft()
            setDraft(EMPTY_DRAFT)
            setRestored(false)
            setDone(false)
            toast({ title: '작성 내용을 지웠습니다.' })
          }}
          className="mt-4 text-sm text-fg-muted underline underline-offset-4 hover:text-primary-deep"
        >
          작성 내용 지우기
        </button>
      </Modal>
    </div>
  )
}

/** 라벨 + 필수 표시 + 에러를 한 곳에서 처리한다 (필드가 반복되어 페이지 안에 둔다) */
function Field({
  label,
  htmlFor,
  required,
  error,
  width,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  /** sm: 짧은 숫자 입력 / md: 단일 Select */
  width?: 'sm' | 'md'
  children: ReactNode
}) {
  return (
    <div id={htmlFor ? `field-${htmlFor}` : undefined}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-base font-semibold text-fg"
      >
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      <div className={cn(width === 'sm' && 'max-w-[200px]', width === 'md' && 'max-w-[320px]')}>
        {children}
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function StatusRow({
  label,
  filled,
  required,
}: {
  label: string
  filled: boolean
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt className="text-base text-fg-muted">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </dt>
      <dd
        className={cn(
          'flex items-center gap-1 text-base',
          filled ? 'font-semibold text-primary-deep' : 'text-fg-subtle',
        )}
      >
        {filled ? <Check className="size-4" aria-hidden /> : <Minus className="size-4" aria-hidden />}
        {filled ? '작성' : '미입력'}
      </dd>
    </div>
  )
}

/** 비로그인 — 기존 EmptyState 를 쓰고 Login 화면이 읽는 state.from 을 함께 넘긴다 */
function LoginRequired() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
        <EmptyState
          title="로그인이 필요합니다."
          description="구직신청은 내 구직 프로필을 등록하는 기능이라 로그인 후 이용할 수 있습니다."
          action={
            <Link
              to="/login"
              state={{ from: '/apply' }}
              className={cn(buttonVariants({ variant: 'primary' }))}
            >
              <LogIn aria-hidden />
              로그인하러 가기
            </Link>
          }
        />
      </div>
    </div>
  )
}

/** "서울특별시" -> "서울". Talent.regions 표기와 맞춘다. */
function shortSido(sido: string) {
  return SIDO_OPTIONS.find((option) => option.value === sido)
    ? sido.replace(/(특별시|광역시|특별자치시|특별자치도|자치도|도)$/, '')
    : sido
}

function careerLabelOf(draft: JobApplyDraft) {
  if (draft.hasCareer === 'no') return '신입'
  if (draft.hasCareer === 'yes' && draft.careerYears) return `경력 ${draft.careerYears}년`
  return undefined
}
