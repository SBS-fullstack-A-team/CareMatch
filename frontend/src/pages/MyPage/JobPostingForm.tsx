import { Briefcase, HeartPulse, MapPin } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DetailSection } from '@/components/common/detail-section'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createJobPosting, getJobPosting, updateJobPosting } from '@/api/job-postings'
import { CATEGORY_OPTIONS, DISTRICT_OPTIONS, EMPLOYMENT_TYPE_OPTIONS, SIDO_OPTIONS, WORK_SCHEDULE_OPTIONS } from '@/data/filters'
import { useApp } from '@/hooks/use-app'
import { ApiError } from '@/lib/api-client'
import type { JobPostingWriteRequest } from '@/types/api'

const WORK_TYPE_OPTIONS = [
  { value: 'COMMUTE', label: '출퇴근' },
  { value: 'LIVE_IN', label: '입주' },
  { value: 'REMOTE', label: '재택' },
  { value: 'NEGOTIABLE', label: '협의 가능' },
]

const PAY_TYPE_OPTIONS = [
  { value: 'HOURLY', label: '시급' },
  { value: 'DAILY', label: '일급' },
  { value: 'MONTHLY', label: '월급' },
]

const CARE_GRADE_OPTIONS = [
  { value: 'GRADE_1', label: '1등급' },
  { value: 'GRADE_2', label: '2등급' },
  { value: 'GRADE_3', label: '3등급' },
  { value: 'GRADE_4', label: '4등급' },
  { value: 'GRADE_5', label: '5등급' },
]

const ELDER_GENDER_OPTIONS = [
  { value: 'MALE', label: '남' },
  { value: 'FEMALE', label: '여' },
]

const MOBILITY_STATUS_OPTIONS = [
  { value: 'INDEPENDENT', label: '보행 가능' },
  { value: 'PARTIAL_ASSIST', label: '부분 도움 필요' },
  { value: 'BEDRIDDEN', label: '거동 불가' },
]

const MEAL_STATUS_OPTIONS = [
  { value: 'SELF', label: '자립' },
  { value: 'ASSIST', label: '도움 필요' },
  { value: 'TUBE', label: '경관 급식' },
]

const COGNITIVE_STATUS_OPTIONS = [
  { value: 'NORMAL', label: '정상' },
  { value: 'MILD', label: '경증 치매' },
  { value: 'SEVERE', label: '중증 치매' },
]

type FormState = {
  title: string
  jobType: string
  description: string
  workType: string
  workSchedule: string
  employmentType: string
  workDays: string
  workStartTime: string
  workEndTime: string
  payType: string
  payAmount: string
  recruitCount: string
  deadline: string
  sido: string
  sigungu: string
  addressDetail: string
  careGrade: string
  elderGender: string
  elderAgeRange: string
  mobilityStatus: string
  mealStatus: string
  cognitiveStatus: string
  elderNote: string
}

const EMPTY_FORM: FormState = {
  title: '',
  jobType: '',
  description: '',
  workType: '',
  workSchedule: '',
  employmentType: '',
  workDays: '',
  workStartTime: '09:00',
  workEndTime: '18:00',
  payType: '',
  payAmount: '',
  recruitCount: '1',
  deadline: '',
  sido: '',
  sigungu: '',
  addressDetail: '',
  careGrade: '',
  elderGender: '',
  elderAgeRange: '',
  mobilityStatus: '',
  mealStatus: '',
  cognitiveStatus: '',
  elderNote: '',
}

/**
 * `/mypage/jobs/new`, `/mypage/jobs/:jobPostingId/edit` — 시설의 공고 등록/수정.
 * 백엔드 필수 필드는 전부 받되, 홍보 문구/이미지/불릿(자격요건·우대사항·복리후생 등)·좌표는
 * 이번 범위에서 제외했다 — null 로 보내면 서버가 정상 처리한다(선택 필드).
 */
export function JobPostingFormPage() {
  const { jobPostingId } = useParams()
  const isEdit = jobPostingId != null
  const numericId = jobPostingId && /^\d+$/.test(jobPostingId) ? Number(jobPostingId) : null
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useApp()
  const isFacility = user?.role === 'FACILITY'

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit || numericId == null) return
    setLoading(true)
    getJobPosting(numericId)
      .then((detail) => {
        setForm({
          title: detail.title,
          jobType: detail.jobType,
          description: detail.description ?? '',
          workType: detail.workType,
          workSchedule: detail.workSchedule ?? '',
          employmentType: detail.employmentType,
          workDays: detail.workDays,
          workStartTime: detail.workStartTime.slice(0, 5),
          workEndTime: detail.workEndTime.slice(0, 5),
          payType: detail.payType,
          payAmount: String(detail.payAmount),
          recruitCount: String(detail.recruitCount),
          deadline: detail.deadline ?? '',
          sido: detail.sido,
          sigungu: detail.sigungu,
          addressDetail: detail.addressDetail ?? '',
          careGrade: detail.careGrade,
          elderGender: detail.elderGender,
          elderAgeRange: detail.elderAgeRange ?? '',
          mobilityStatus: detail.mobilityStatus,
          mealStatus: detail.mealStatus,
          cognitiveStatus: detail.cognitiveStatus,
          elderNote: detail.elderNote ?? '',
        })
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [isEdit, numericId])

  if (!isFacility) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState title="시설회원 전용 화면입니다." description="공고 등록은 시설회원만 이용할 수 있습니다." />
      </div>
    )
  }

  if (isEdit && loading) {
    return (
      <div className="overflow-hidden rounded-card border border-border">
        <LoadingState rows={6} />
      </div>
    )
  }

  if (isEdit && (loadError || numericId == null)) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState title="공고를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요." />
      </div>
    )
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!form.title.trim()) next.title = '공고 제목을 입력해 주세요.'
    if (!form.jobType) next.jobType = '직종을 선택해 주세요.'
    if (!form.workType) next.workType = '근무형태를 선택해 주세요.'
    if (form.workType !== 'LIVE_IN' && !form.workSchedule) {
      next.workSchedule = '입주형이 아니면 근무 시간대를 선택해 주세요.'
    }
    if (!form.employmentType) next.employmentType = '고용형태를 선택해 주세요.'
    if (!form.workDays.trim()) next.workDays = '근무 요일을 입력해 주세요. (예: 월~금)'
    if (!form.workStartTime) next.workStartTime = '근무 시작 시간을 입력해 주세요.'
    if (!form.workEndTime) next.workEndTime = '근무 종료 시간을 입력해 주세요.'
    if (!form.payType) next.payType = '급여 유형을 선택해 주세요.'
    if (!form.payAmount || Number(form.payAmount) <= 0) next.payAmount = '급여를 입력해 주세요.'
    if (!form.recruitCount || Number(form.recruitCount) <= 0) next.recruitCount = '모집 인원을 입력해 주세요.'
    if (!form.deadline) next.deadline = '마감일을 선택해 주세요.'
    if (!form.sido) next.sido = '지역(시/도)을 선택해 주세요.'
    if (!form.sigungu) next.sigungu = '지역(시/군/구)을 선택해 주세요.'
    if (!form.careGrade) next.careGrade = '장기요양등급을 선택해 주세요.'
    if (!form.elderGender) next.elderGender = '어르신 성별을 선택해 주세요.'
    if (!form.mobilityStatus) next.mobilityStatus = '거동 상태를 선택해 주세요.'
    if (!form.mealStatus) next.mealStatus = '식사 상태를 선택해 주세요.'
    if (!form.cognitiveStatus) next.cognitiveStatus = '인지 상태를 선택해 주세요.'
    return next
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const nextErrors = validate()
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.scrollIntoView({ block: 'center' })
      return
    }

    const payload: JobPostingWriteRequest = {
      title: form.title.trim(),
      jobType: form.jobType as JobPostingWriteRequest['jobType'],
      description: form.description.trim() || undefined,
      workType: form.workType as JobPostingWriteRequest['workType'],
      workSchedule:
        form.workType === 'LIVE_IN'
          ? undefined
          : (form.workSchedule as JobPostingWriteRequest['workSchedule']),
      employmentType: form.employmentType as JobPostingWriteRequest['employmentType'],
      workDays: form.workDays.trim(),
      workStartTime: `${form.workStartTime}:00`,
      workEndTime: `${form.workEndTime}:00`,
      payType: form.payType as JobPostingWriteRequest['payType'],
      payAmount: Number(form.payAmount),
      recruitCount: Number(form.recruitCount),
      deadline: form.deadline,
      sido: form.sido,
      sigungu: form.sigungu,
      addressDetail: form.addressDetail.trim() || undefined,
      careGrade: form.careGrade as JobPostingWriteRequest['careGrade'],
      elderGender: form.elderGender as JobPostingWriteRequest['elderGender'],
      elderAgeRange: form.elderAgeRange.trim() || undefined,
      mobilityStatus: form.mobilityStatus as JobPostingWriteRequest['mobilityStatus'],
      mealStatus: form.mealStatus as JobPostingWriteRequest['mealStatus'],
      cognitiveStatus: form.cognitiveStatus as JobPostingWriteRequest['cognitiveStatus'],
      elderNote: form.elderNote.trim() || undefined,
    }

    setSubmitting(true)
    try {
      const result =
        isEdit && numericId != null
          ? await updateJobPosting(numericId, payload)
          : await createJobPosting(payload)
      toast({ title: isEdit ? '공고를 수정했습니다.' : '공고를 등록했습니다.' })
      navigate(`/jobs/${result.id}`)
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const districtOptions = DISTRICT_OPTIONS[form.sido] ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-fg">{isEdit ? '공고 수정' : '공고 등록'}</h1>
      {!isEdit && (
        <p className="mt-2 text-base text-fg-muted">
          등록 시 기본 500P가 차감됩니다. 포인트가 부족하면 등록이 거절됩니다.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
        <DetailSection title="기본 정보" icon={Briefcase}>
          <div className="space-y-4">
            <Field label="공고 제목" htmlFor="title" required error={errors.title}>
              <Input
                id="title"
                placeholder="예) 강남구 요양보호사 모집합니다"
                value={form.title}
                invalid={Boolean(errors.title)}
                onChange={(event) => set('title', event.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="직종" htmlFor="jobType" required error={errors.jobType}>
                <Select
                  id="jobType"
                  placeholder="직종 선택"
                  options={CATEGORY_OPTIONS}
                  value={form.jobType}
                  invalid={Boolean(errors.jobType)}
                  onChange={(event) => set('jobType', event.target.value)}
                />
              </Field>
              <Field label="고용형태" htmlFor="employmentType" required error={errors.employmentType}>
                <Select
                  id="employmentType"
                  placeholder="고용형태 선택"
                  options={EMPLOYMENT_TYPE_OPTIONS}
                  value={form.employmentType}
                  invalid={Boolean(errors.employmentType)}
                  onChange={(event) => set('employmentType', event.target.value)}
                />
              </Field>
            </div>

            <Field label="공고 상세 설명" htmlFor="description" error={errors.description}>
              <Textarea
                id="description"
                placeholder="업무 내용, 지원 방법 등을 자유롭게 작성해 주세요. (선택)"
                rows={5}
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
              />
            </Field>
          </div>
        </DetailSection>

        <DetailSection title="근무 조건" icon={MapPin}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="근무형태" htmlFor="workType" required error={errors.workType}>
                <Select
                  id="workType"
                  placeholder="근무형태 선택"
                  options={WORK_TYPE_OPTIONS}
                  value={form.workType}
                  invalid={Boolean(errors.workType)}
                  onChange={(event) => set('workType', event.target.value)}
                />
              </Field>
              <Field
                label="근무 시간대"
                htmlFor="workSchedule"
                required={form.workType !== 'LIVE_IN'}
                error={errors.workSchedule}
              >
                <Select
                  id="workSchedule"
                  placeholder={form.workType === 'LIVE_IN' ? '입주형은 선택 안 함' : '시간대 선택'}
                  options={WORK_SCHEDULE_OPTIONS}
                  value={form.workSchedule}
                  disabled={form.workType === 'LIVE_IN'}
                  invalid={Boolean(errors.workSchedule)}
                  onChange={(event) => set('workSchedule', event.target.value)}
                />
              </Field>
            </div>

            <Field label="근무 요일" htmlFor="workDays" required error={errors.workDays}>
              <Input
                id="workDays"
                placeholder="예) 월~금, 주5일, 협의 가능"
                value={form.workDays}
                invalid={Boolean(errors.workDays)}
                onChange={(event) => set('workDays', event.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="근무 시작 시간" htmlFor="workStartTime" required error={errors.workStartTime}>
                <Input
                  id="workStartTime"
                  type="time"
                  value={form.workStartTime}
                  invalid={Boolean(errors.workStartTime)}
                  onChange={(event) => set('workStartTime', event.target.value)}
                />
              </Field>
              <Field label="근무 종료 시간" htmlFor="workEndTime" required error={errors.workEndTime}>
                <Input
                  id="workEndTime"
                  type="time"
                  value={form.workEndTime}
                  invalid={Boolean(errors.workEndTime)}
                  onChange={(event) => set('workEndTime', event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="급여 유형" htmlFor="payType" required error={errors.payType}>
                <Select
                  id="payType"
                  placeholder="급여 유형"
                  options={PAY_TYPE_OPTIONS}
                  value={form.payType}
                  invalid={Boolean(errors.payType)}
                  onChange={(event) => set('payType', event.target.value)}
                />
              </Field>
              <Field label="급여액(원)" htmlFor="payAmount" required error={errors.payAmount}>
                <Input
                  id="payAmount"
                  inputMode="numeric"
                  placeholder="예) 2200000"
                  value={form.payAmount}
                  invalid={Boolean(errors.payAmount)}
                  onChange={(event) => set('payAmount', event.target.value.replace(/[^0-9]/g, ''))}
                />
              </Field>
              <Field label="모집 인원" htmlFor="recruitCount" required error={errors.recruitCount}>
                <Input
                  id="recruitCount"
                  inputMode="numeric"
                  value={form.recruitCount}
                  invalid={Boolean(errors.recruitCount)}
                  onChange={(event) => set('recruitCount', event.target.value.replace(/[^0-9]/g, ''))}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="모집 마감일" htmlFor="deadline" required error={errors.deadline}>
                <Input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  invalid={Boolean(errors.deadline)}
                  onChange={(event) => set('deadline', event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="지역(시/도)" htmlFor="sido" required error={errors.sido}>
                <Select
                  id="sido"
                  placeholder="시/도 선택"
                  options={SIDO_OPTIONS}
                  value={form.sido}
                  invalid={Boolean(errors.sido)}
                  onChange={(event) => {
                    set('sido', event.target.value)
                    set('sigungu', '')
                  }}
                />
              </Field>
              <Field label="지역(시/군/구)" htmlFor="sigungu" required error={errors.sigungu}>
                <Select
                  id="sigungu"
                  placeholder={form.sido ? '시/군/구 선택' : '시/도를 먼저 선택하세요'}
                  options={districtOptions}
                  value={form.sigungu}
                  disabled={!form.sido}
                  invalid={Boolean(errors.sigungu)}
                  onChange={(event) => set('sigungu', event.target.value)}
                />
              </Field>
            </div>

            <Field label="상세 주소" htmlFor="addressDetail" error={errors.addressDetail}>
              <Input
                id="addressDetail"
                placeholder="선택 입력"
                value={form.addressDetail}
                onChange={(event) => set('addressDetail', event.target.value)}
              />
            </Field>
          </div>
        </DetailSection>

        <DetailSection title="어르신 정보" icon={HeartPulse}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="장기요양등급" htmlFor="careGrade" required error={errors.careGrade}>
                <Select
                  id="careGrade"
                  placeholder="등급 선택"
                  options={CARE_GRADE_OPTIONS}
                  value={form.careGrade}
                  invalid={Boolean(errors.careGrade)}
                  onChange={(event) => set('careGrade', event.target.value)}
                />
              </Field>
              <Field label="성별" htmlFor="elderGender" required error={errors.elderGender}>
                <Select
                  id="elderGender"
                  placeholder="성별 선택"
                  options={ELDER_GENDER_OPTIONS}
                  value={form.elderGender}
                  invalid={Boolean(errors.elderGender)}
                  onChange={(event) => set('elderGender', event.target.value)}
                />
              </Field>
              <Field label="연령대" htmlFor="elderAgeRange" error={errors.elderAgeRange}>
                <Input
                  id="elderAgeRange"
                  placeholder="예) 80대 (선택)"
                  value={form.elderAgeRange}
                  onChange={(event) => set('elderAgeRange', event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="거동 상태" htmlFor="mobilityStatus" required error={errors.mobilityStatus}>
                <Select
                  id="mobilityStatus"
                  placeholder="거동 상태"
                  options={MOBILITY_STATUS_OPTIONS}
                  value={form.mobilityStatus}
                  invalid={Boolean(errors.mobilityStatus)}
                  onChange={(event) => set('mobilityStatus', event.target.value)}
                />
              </Field>
              <Field label="식사 상태" htmlFor="mealStatus" required error={errors.mealStatus}>
                <Select
                  id="mealStatus"
                  placeholder="식사 상태"
                  options={MEAL_STATUS_OPTIONS}
                  value={form.mealStatus}
                  invalid={Boolean(errors.mealStatus)}
                  onChange={(event) => set('mealStatus', event.target.value)}
                />
              </Field>
              <Field label="인지 상태" htmlFor="cognitiveStatus" required error={errors.cognitiveStatus}>
                <Select
                  id="cognitiveStatus"
                  placeholder="인지 상태"
                  options={COGNITIVE_STATUS_OPTIONS}
                  value={form.cognitiveStatus}
                  invalid={Boolean(errors.cognitiveStatus)}
                  onChange={(event) => set('cognitiveStatus', event.target.value)}
                />
              </Field>
            </div>

            <Field label="특이사항" htmlFor="elderNote" error={errors.elderNote}>
              <Textarea
                id="elderNote"
                placeholder="낙상 주의, 알레르기, 과거 병력 등 (선택)"
                rows={3}
                maxLength={2000}
                value={form.elderNote}
                onChange={(event) => set('elderNote', event.target.value)}
              />
            </Field>
          </div>
        </DetailSection>

        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/mypage/jobs')}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '저장 중…' : isEdit ? '수정하기' : '등록하기'}
          </Button>
        </div>
      </form>
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
  htmlFor: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div id={`field-${htmlFor}`}>
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
