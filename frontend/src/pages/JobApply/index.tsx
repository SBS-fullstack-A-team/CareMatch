import { Award, Check, ClipboardList, FileText, LogIn, Minus, UserRound } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyJobSeekerProfile, updateMyJobSeekerProfile } from '@/api/jobseekers'
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
import { Select, type SelectOption } from '@/components/ui/select'
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
import { jobCategoryLabel } from '@/data/labels'
import { useApp, type SessionUser } from '@/hooks/use-app'
import { ApiError } from '@/lib/api-client'
import { cn, formatPay, type PayType } from '@/lib/utils'
import type { Talent } from '@/types'
import type { JobSeekerProfileResponseDto } from '@/types/api'
import {
  clearDraft,
  EMPTY_DRAFT,
  loadDraft,
  saveDraft,
  validateDraft,
  type DraftField,
  type JobApplyDraft,
} from './draft'
import { buildUpdateRequest, profileToDraft, toDraftField } from './profile-mapper'

/**
 * 구직신청 (/apply)
 *
 * "내 구직 프로필 등록/수정" 화면이다. 특정 공고 지원(`POST /api/job-postings/{id}/applications`)은
 * 성격이 달라 이 화면에서 다루지 않으며, jobId 쿼리도 읽지 않는다.
 *
 * 서버 프로필(`GET/PUT /api/jobseekers/me`, JOBSEEKER 전용)이 원본이다.
 * - 진입 시 항상 서버에서 불러와 폼을 채운다. 임시저장(localStorage)은 사용자가 불러오기를 눌렀을 때만 적용한다.
 * - PUT 은 전체 덮어쓰기라 조회한 서버 프로필에 폼 값만 바꿔 끼워 보낸다 (profile-mapper.ts).
 * 폼 상태는 Login 화면과 같이 useState 로 관리한다 (공유 UI 가 forwardRef 가 아니라 RHF 미사용).
 */
export function JobApplyPage() {
  const { user, authReady } = useApp()

  // ---------------- 세션 확인 ----------------
  if (!authReady) {
    return (
      <div className="container-page py-10">
        <LoadingState rows={2} />
      </div>
    )
  }

  if (!user) return <LoginRequired />

  // 구직자 프로필 API 는 JOBSEEKER 전용이라, 다른 역할은 폼(=API 호출)까지 가지 않는다
  if (user.role !== 'JOBSEEKER') return <RoleNotice user={user} />

  return <JobApplyForm userName={user.name} />
}

type LoadError = { status: number; message: string }

function JobApplyForm({ userName }: { userName: string }) {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [serverProfile, setServerProfile] = useState<JobSeekerProfileResponseDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError | null>(null)

  const [draft, setDraft] = useState<JobApplyDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<Partial<Record<DraftField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  /** 이 브라우저에 남아 있는 임시저장. 자동 적용하지 않고 안내만 한다. */
  const [storedDraft, setStoredDraft] = useState<JobApplyDraft | null>(() => loadDraft())

  /** 늦게 도착한 이전 요청 응답이 최신 상태를 덮지 않도록 요청마다 번호를 매긴다 */
  const requestId = useRef(0)

  const load = useCallback(() => {
    const id = ++requestId.current
    setLoading(true)
    setLoadError(null)
    getMyJobSeekerProfile()
      .then((profile) => {
        if (id !== requestId.current) return
        setServerProfile(profile)
        setDraft(profileToDraft(profile))
        setErrors({})
      })
      .catch((err) => {
        if (id !== requestId.current) return
        setLoadError(toLoadError(err))
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = (patch: Partial<JobApplyDraft>) => setDraft((prev) => ({ ...prev, ...patch }))

  /**
   * 이미 표시된 에러는 값이 채워지는 즉시 지운다.
   * 아직 건드리지 않은 필드에 새 에러를 미리 띄우지는 않는다.
   */
  useEffect(() => {
    setErrors((prev) => {
      const shown = Object.keys(prev) as DraftField[]
      if (shown.length === 0) return prev
      const remaining = validateDraft(draft)
      const next: Partial<Record<DraftField, string>> = {}
      shown.forEach((key) => {
        if (remaining[key]) next[key] = remaining[key]
      })
      return Object.keys(next).length === shown.length ? prev : next
    })
  }, [draft])

  // 서버에 저장된 값이 현재 옵션 목록에 없어도(예: 직종 ETC) 화면에서 사라지지 않게 한다
  const categoryOptions = withCurrentOption(
    CATEGORY_OPTIONS,
    draft.category,
    jobCategoryLabel(draft.category),
  )
  const sidoOptions = withCurrentOption(SIDO_OPTIONS, draft.sido)
  const districts = withCurrentOption(DISTRICT_OPTIONS[draft.sido] ?? [], draft.district)

  /** 미리보기 — 카드가 채워질 만큼 입력됐을 때만 만든다 (빈 값을 임의로 채우지 않는다) */
  const previewTalent = useMemo<Talent | null>(() => {
    if (!draft.category || !draft.sido || !draft.workSchedule) return null
    if (!draft.gender || !draft.age) return null

    const region = draft.district ? `${shortSido(draft.sido)} ${draft.district}` : shortSido(draft.sido)

    return {
      id: 'preview',
      name: userName,
      gender: draft.gender,
      age: Number(draft.age),
      category: draft.category as Talent['category'],
      regions: [region],
      certificates: draft.certificates as Talent['certificates'],
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
  }, [draft, userName])

  const handleSaveDraft = () => {
    if (saveDraft(draft)) {
      toast({
        title: '이 브라우저에 임시저장했습니다.',
        description: '내 구직 프로필에 저장하려면 [구직신청 등록]을 눌러 주세요.',
      })
    } else {
      toast({ variant: 'error', title: '임시저장에 실패했습니다.' })
    }
  }

  /** 임시저장 불러오기 — 폼 필드만 바꾼다. 서버에만 있는 값은 serverProfile 에 그대로 남는다. */
  const applyStoredDraft = () => {
    if (!storedDraft) return
    // 자격증은 서버 등록 현황을 보여주는 칸이라 임시저장 값으로 바꾸지 않는다
    setDraft((prev) => ({ ...storedDraft, certificates: prev.certificates }))
    setStoredDraft(null)
    toast({
      title: '임시저장한 내용을 불러왔습니다.',
      description: '[구직신청 등록]을 눌러야 내 구직 프로필에 저장됩니다.',
    })
  }

  const discardStoredDraft = () => {
    clearDraft()
    setStoredDraft(null)
    toast({ title: '임시저장한 내용을 삭제했습니다.' })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    // 서버 프로필 없이 PUT 하면 폼에 없는 값이 전부 지워지므로 조회 성공 전에는 저장하지 않는다
    if (!serverProfile || saving) return

    setFormError(null)
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)
    if (focusFirstError(nextErrors)) return

    setSaving(true)
    try {
      const updated = await updateMyJobSeekerProfile(buildUpdateRequest(serverProfile, draft))
      setServerProfile(updated)
      setDraft(profileToDraft(updated))
      setErrors({})
      clearDraft()
      setStoredDraft(null)
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // 세션이 끝나면 화면이 로그인 안내로 바뀌므로, 작성 중이던 내용은 임시저장으로 남긴다
        const kept = saveDraft(draft)
        toast({
          variant: 'error',
          title: '로그인이 만료되어 저장하지 못했습니다.',
          description: kept
            ? '작성 중이던 내용은 임시저장했습니다. 다시 로그인한 뒤 불러와 주세요.'
            : '다시 로그인한 뒤 저장해 주세요.',
        })
        return
      }

      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        const fieldErrors: Partial<Record<DraftField, string>> = {}
        err.fieldErrors.forEach(({ field, reason }) => {
          const key = toDraftField(field)
          if (key && !fieldErrors[key]) fieldErrors[key] = reason
        })
        setErrors(fieldErrors)
        focusFirstError(fieldErrors)
      }
      setFormError(toSaveErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  /** 완료 후 "맞춤 일자리 보기" — JobListPage 가 실제로 읽는 파라미터만 넘긴다 */
  const matchedJobsHref = useMemo(() => {
    const params = new URLSearchParams()
    if (draft.sido) params.set('sido', draft.sido)
    if (draft.district) params.set('district', draft.district)
    if (draft.category) params.set('category', draft.category)
    return `/jobs?${params.toString()}`
  }, [draft.sido, draft.district, draft.category])

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb items={[{ label: '홈', to: '/' }, { label: '구직신청' }]} />

      <header className="mt-3">
        <h1 className="text-3xl font-bold text-fg">구직신청</h1>
        <p className="mt-2 text-base text-fg-muted">
          원하는 조건을 등록하면 나에게 맞는 일자리를 더 쉽게 찾을 수 있어요.
        </p>
      </header>

      {loading ? (
        <div className="mt-5 overflow-hidden rounded-card border border-border">
          <LoadingState rows={4} />
        </div>
      ) : loadError || !serverProfile ? (
        <ProfileLoadFailed error={loadError} onRetry={load} />
      ) : (
        <>
          {storedDraft && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
              <p className="text-base text-fg-muted">
                이 브라우저에 임시저장한 내용이 있습니다. 불러오시겠습니까?
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={applyStoredDraft}>
                  불러오기
                </Button>
                <Button variant="ghost" size="sm" onClick={discardStoredDraft}>
                  삭제
                </Button>
              </div>
            </div>
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

                  <Field label="나이" htmlFor="age" error={errors.age} width="sm">
                    <div className="flex items-center gap-2">
                      <Input
                        id="age"
                        type="number"
                        min={19}
                        max={99}
                        inputMode="numeric"
                        placeholder="예) 52"
                        value={draft.age}
                        invalid={Boolean(errors.age)}
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
                      options={categoryOptions}
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
                        options={sidoOptions}
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

                  <Field label="희망 근무시간" htmlFor="preferredHours" error={errors.preferredHours}>
                    <Input
                      id="preferredHours"
                      maxLength={100}
                      placeholder="예) 평일 오전 (09:00 ~ 13:00)"
                      value={draft.preferredHours}
                      invalid={Boolean(errors.preferredHours)}
                      onChange={(event) => update({ preferredHours: event.target.value })}
                    />
                  </Field>

                  <Field label="희망 최소 급여" htmlFor="payType" error={errors.payAmount}>
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
                          aria-label="희망 최소 급여 금액"
                          type="number"
                          min={0}
                          step={1000}
                          inputMode="numeric"
                          placeholder="예) 2500000"
                          value={draft.payAmount}
                          invalid={Boolean(errors.payAmount)}
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

                  <Field label="경력 연수" htmlFor="careerYears" error={errors.careerYears} width="sm">
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
                        invalid={Boolean(errors.careerYears)}
                        onChange={(event) => update({ careerYears: event.target.value })}
                      />
                      <span className="shrink-0 text-base text-fg-muted">년</span>
                    </div>
                    {draft.hasCareer === 'no' && (
                      <p className="mt-2 text-sm text-fg-muted">신입은 경력 연수를 입력하지 않습니다.</p>
                    )}
                  </Field>

                  <Field label="자격증">
                    <p className="mb-2 text-sm text-fg-muted">
                      등록된 자격증이 표시됩니다. 자격증 등록·관리는{' '}
                      <Link
                        to="/mypage/certificates"
                        className="font-semibold text-primary-deep underline underline-offset-4"
                      >
                        마이페이지 › 자격증
                      </Link>
                      에서 진행할 수 있습니다.
                    </p>
                    <div className="grid gap-x-6 sm:grid-cols-2">
                      {CERTIFICATE_OPTIONS.map((option) => (
                        <Checkbox
                          key={option.value}
                          label={option.label}
                          checked={draft.certificates.includes(option.value)}
                          readOnly
                          disabled
                        />
                      ))}
                    </div>
                  </Field>
                </div>
              </DetailSection>

              {/* ④ 자기소개 */}
              <DetailSection title="자기소개" icon={FileText}>
                <div className="space-y-5">
                  <Field label="자기소개" htmlFor="summary" error={errors.summary}>
                    <Textarea
                      id="summary"
                      rows={6}
                      maxLength={500}
                      placeholder="자신의 경력이나 강점, 근무할 때 중요하게 생각하는 점을 자유롭게 작성해주세요."
                      value={draft.summary}
                      invalid={Boolean(errors.summary)}
                      onChange={(event) => update({ summary: event.target.value })}
                    />
                    <p className="mt-2 text-sm text-fg-subtle tabular">{draft.summary.length} / 500</p>
                  </Field>

                  <div>
                    <Checkbox
                      label="지금 바로 근무할 수 있어요"
                      checked={draft.availableNow}
                      onChange={(event) => update({ availableNow: event.target.checked })}
                    />
                    <p className="text-sm text-fg-muted">
                      이 항목은 아직 내 구직 프로필에 저장되지 않으며, 미리보기와 임시저장에만 반영됩니다.
                    </p>
                  </div>
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
                {formError && (
                  <p className="text-sm text-danger" role="alert">
                    {formError}
                  </p>
                )}
                <Button type="submit" block disabled={saving}>
                  {saving ? '저장 중…' : '구직신청 등록'}
                </Button>
                <Button type="button" variant="secondary" block onClick={handleSaveDraft}>
                  임시저장
                </Button>
                <p className="text-sm text-fg-subtle">
                  임시저장은 이 브라우저에만 보관됩니다. [구직신청 등록]을 눌러야 내 구직 프로필에
                  저장됩니다.
                </p>
              </div>
            </aside>
          </form>
        </>
      )}

      {/* ---------------- 등록 완료 (서버 저장 성공 시에만) ---------------- */}
      <Modal
        open={done}
        onClose={() => setDone(false)}
        title="구직 프로필이 저장되었습니다."
        description="입력한 내용이 내 구직 프로필에 저장되었습니다."
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
      </Modal>
    </div>
  )
}

/** 에러가 있으면 첫 번째 필드로 스크롤하고 true */
function focusFirstError(errors: Partial<Record<DraftField, string>>) {
  const first = Object.keys(errors)[0] as DraftField | undefined
  if (!first) return false
  // 급여 금액 입력은 급여 Field(id=field-payType) 안에 있다
  const target = first === 'payAmount' ? 'payType' : first
  document.getElementById(`field-${target}`)?.scrollIntoView({ block: 'center' })
  return true
}

function toLoadError(err: unknown): LoadError {
  if (!(err instanceof ApiError)) {
    return { status: 0, message: '잠시 후 다시 시도해 주세요.' }
  }
  switch (err.status) {
    case 401:
      return { status: 401, message: '로그인이 만료되었습니다. 다시 로그인해 주세요.' }
    case 403:
      return {
        status: 403,
        message: '구직자 회원만 구직 프로필을 불러올 수 있습니다. 로그인한 계정의 회원 유형을 확인해 주세요.',
      }
    case 404:
      return {
        status: 404,
        message: '구직 프로필을 찾을 수 없습니다. 문제가 계속되면 고객센터로 문의해 주세요.',
      }
    default:
      return { status: err.status, message: err.message }
  }
}

function toSaveErrorMessage(err: unknown) {
  if (!(err instanceof ApiError)) return '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  switch (err.status) {
    case 400:
      return `입력한 내용을 확인해 주세요. (${err.message})`
    case 403:
      return '구직자 회원만 구직 프로필을 저장할 수 있습니다. 로그인한 계정의 회원 유형을 확인해 주세요.'
    case 404:
      return '구직 프로필을 찾을 수 없어 저장하지 못했습니다. 문제가 계속되면 고객센터로 문의해 주세요.'
    default:
      return err.message
  }
}

/** 옵션 목록에 없는 현재 값을 끝에 붙여 선택 상태가 보이게 한다 (값을 바꾸거나 버리지 않는다) */
function withCurrentOption(options: SelectOption[], value: string, label = value): SelectOption[] {
  if (!value || options.some((option) => option.value === value)) return options
  return [...options, { value, label }]
}

/** 프로필 조회 실패 — 서버 데이터 없이 폼을 띄우지 않는다 (임시저장으로 대신 채우지 않음) */
function ProfileLoadFailed({ error, onRetry }: { error: LoadError | null; onRetry: () => void }) {
  return (
    <div className="mt-5 rounded-card border border-border bg-surface">
      <EmptyState
        title="구직 프로필을 불러오지 못했습니다."
        description={error?.message ?? '잠시 후 다시 시도해 주세요.'}
        action={
          error?.status === 401 ? (
            <Link
              to="/login"
              state={{ from: '/apply' }}
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
            >
              <LogIn aria-hidden />
              로그인하러 가기
            </Link>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={onRetry}>
                다시 시도
              </Button>
              {error?.status === 404 && (
                <Link
                  to="/support/inquiry"
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                >
                  1:1 문의하기
                </Link>
              )}
            </div>
          )
        }
      />
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

/**
 * 구직자가 아닌 로그인 회원. MyPageLayout 과 같이 GUEST 는 유형 선택으로 보내고,
 * 시설회원·관리자에게는 구직자 전용 기능임을 안내한다.
 */
function RoleNotice({ user }: { user: SessionUser }) {
  const isGuest = user.role === 'GUEST'
  const isFacility = user.role === 'FACILITY'

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-[520px] rounded-card border border-border bg-surface">
        {isGuest ? (
          <EmptyState
            title="회원 유형 선택이 필요합니다."
            description="구직신청을 이용하려면 회원 유형(구직자/시설회원)을 먼저 선택해 주세요."
            action={
              <Link to="/oauth/select-role" className={cn(buttonVariants({ variant: 'primary' }))}>
                유형 선택하러 가기
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="구직자 회원만 이용할 수 있습니다."
            description="구직신청은 구직자 회원이 내 구직 프로필을 등록·수정하는 기능입니다."
            action={
              <Link
                to={isFacility ? '/talents' : '/'}
                className={cn(buttonVariants({ variant: 'secondary' }))}
              >
                {isFacility ? '인재정보 보기' : '홈으로'}
              </Link>
            }
          />
        )}
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
