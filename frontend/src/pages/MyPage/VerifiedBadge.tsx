import { Award, BadgeCheck, Building2, Check, FileText, Plus, Trash2, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
  createCareerVerification,
  deleteCareerVerification,
  getMyBadgeRequests,
  getMyCareerVerifications,
  requestVerifiedBadge,
} from '@/api/badge'
import { getMyCertificates } from '@/api/certificates'
import { getMyJobSeekerProfile } from '@/api/jobseekers'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { ApiError } from '@/lib/api-client'
import { ACCEPT_ATTR, FileUploadError, uploadFile } from '@/lib/file-upload'
import { LoadFailed } from '@/pages/Support/shared'
import type { CareerVerificationDetailResponse, ReviewStatus } from '@/types/api'

const STATUS_BADGE: Record<ReviewStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: '심사 대기', variant: 'neutralOutline' },
  APPROVED: { label: '승인', variant: 'new' },
  REJECTED: { label: '반려', variant: 'closing' },
}

/** "2024-03-01" + null -> "2024.03.01 ~ 재직중" */
function periodLabel(start: string, end: string | null) {
  const dot = (iso: string) => iso.split('-').join('.')
  return `${dot(start)} ~ ${end ? dot(end) : '재직중'}`
}

/**
 * `/mypage/verified-badge` — 구직자 전용 "인증구직자" 마크 신청 화면.
 *
 * 마크는 관리자가 자격증 진위와 경력을 각각 승인한 뒤, 마크 신청까지 최종 승인해야 붙는다.
 * 이 화면은 그 단계별 현재 상태를 보여주고 경력 인증 등록·마크 신청을 처리한다.
 * (자격증 등록 자체는 휴대폰 인증이 필요해 `/mypage/certificates` 에서 한다)
 */
export function MyPageVerifiedBadgePage() {
  const { user } = useApp()
  const { toast } = useToast()
  const isJobSeeker = user?.role === 'JOBSEEKER'

  const { data, loading, error, reload } = useAsync(
    () =>
      isJobSeeker
        ? Promise.all([
            getMyJobSeekerProfile(),
            getMyCertificates(),
            getMyCareerVerifications(),
            getMyBadgeRequests(),
          ])
        : Promise.resolve(null),
    [isJobSeeker],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [organizationName, setOrganizationName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [requesting, setRequesting] = useState(false)

  if (!isJobSeeker) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          title="구직자 전용 화면입니다."
          description="인증구직자 마크는 구직회원만 신청할 수 있습니다."
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-card border border-border">
        <LoadingState rows={4} />
      </div>
    )
  }
  if (error || !data) {
    return <LoadFailed message={error ?? '잠시 후 다시 시도해 주세요.'} onRetry={reload} />
  }

  const [profile, certificates, careers, badgeRequests] = data
  const approvedCertificates = certificates.filter((item) => item.adminReviewStatus === 'APPROVED')
  const approvedCareers = careers.filter((item) => item.status === 'APPROVED')
  const pendingRequest = badgeRequests.find((item) => item.status === 'PENDING')
  const lastRejected = badgeRequests.find((item) => item.status === 'REJECTED')
  const canRequest =
    !profile.verifiedBadge &&
    !pendingRequest &&
    approvedCertificates.length > 0 &&
    approvedCareers.length > 0

  const resetForm = () => {
    setOrganizationName('')
    setRoleTitle('')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFormError(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const handleSubmitCareer = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationName.trim() || !startDate) {
      setFormError('근무 기관과 시작일은 반드시 입력해 주세요.')
      return
    }
    if (endDate && endDate < startDate) {
      setFormError('종료일은 시작일보다 빠를 수 없습니다.')
      return
    }
    if (!file) {
      setFormError('재직증명서·경력증명서 등 증빙 파일을 첨부해 주세요.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      // 자격증과 같은 순서: 업로드 URL 발급 -> 스토리지로 직접 PUT -> 받은 fileKey 로 신청
      const uploaded = await uploadFile(file, 'CAREER_PROOF')
      await createCareerVerification({
        fileKey: uploaded.fileKey,
        organizationName: organizationName.trim(),
        roleTitle: roleTitle.trim() || null,
        startDate,
        endDate: endDate || null,
        description: description.trim() || null,
      })
      toast({
        title: '경력 인증을 신청했습니다.',
        description: '관리자 확인 후 결과를 알림으로 알려드립니다.',
      })
      closeForm()
      reload()
    } catch (err) {
      setFormError(
        err instanceof FileUploadError || err instanceof ApiError
          ? err.message
          : '신청에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCareer = async (career: CareerVerificationDetailResponse) => {
    if (!window.confirm(`${career.organizationName} 경력 인증을 삭제할까요?`)) return
    setDeletingId(career.id)
    try {
      await deleteCareerVerification(career.id)
      toast({ title: '경력 인증을 삭제했습니다.' })
      reload()
    } catch (err) {
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다.',
        description: err instanceof ApiError ? err.message : undefined,
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleRequestBadge = async () => {
    setRequesting(true)
    try {
      await requestVerifiedBadge()
      toast({
        title: '인증구직자 마크를 신청했습니다.',
        description: '관리자 확인 후 결과를 알림으로 알려드립니다.',
      })
      reload()
    } catch (err) {
      toast({
        variant: 'error',
        title: '마크 신청에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-fg">인증구직자</h1>
      <p className="mt-2 text-base text-fg-muted">
        자격증과 경력을 관리자가 확인하면 인재정보에 인증 마크가 표시됩니다.
      </p>

      {/* ---------------- 현재 상태 + 마크 신청 ---------------- */}
      <section
        className={
          profile.verifiedBadge
            ? 'mt-5 rounded-card border border-primary/35 bg-primary-light/60 p-6'
            : 'mt-5 rounded-card border border-border bg-surface p-6'
        }
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
          <BadgeCheck className="size-5 shrink-0 text-primary-deep" aria-hidden />
          {profile.verifiedBadge ? '인증구직자 마크를 보유하고 있습니다' : '아직 인증 마크가 없습니다'}
        </h2>

        <ul className="mt-4 space-y-2.5">
          <RequirementRow
            done={approvedCertificates.length > 0}
            label="자격증 인증"
            detail={
              approvedCertificates.length > 0
                ? `승인 ${approvedCertificates.length}건`
                : certificates.length > 0
                  ? '등록한 자격증이 관리자 심사를 기다리고 있습니다.'
                  : '자격증을 먼저 등록해 주세요.'
            }
          />
          <RequirementRow
            done={approvedCareers.length > 0}
            label="경력 인증"
            detail={
              approvedCareers.length > 0
                ? `승인 ${approvedCareers.length}건`
                : careers.length > 0
                  ? '신청한 경력이 관리자 심사를 기다리고 있습니다.'
                  : '아래에서 경력을 등록해 주세요.'
            }
          />
        </ul>

        {!profile.verifiedBadge && (
          <div className="mt-5">
            {pendingRequest ? (
              <p className="text-base text-fg-muted">
                마크 신청이 접수되어 관리자 확인을 기다리고 있습니다.
              </p>
            ) : (
              <>
                <Button type="button" disabled={!canRequest || requesting} onClick={handleRequestBadge}>
                  {requesting ? '신청 중…' : '인증 마크 신청하기'}
                </Button>
                {!canRequest && (
                  <p className="mt-2 text-sm text-fg-muted">
                    자격증과 경력이 각각 1건 이상 승인되어야 신청할 수 있습니다.
                  </p>
                )}
                {lastRejected?.rejectReason && (
                  <p className="mt-3 text-sm text-danger">
                    이전 신청 반려 사유: {lastRejected.rejectReason}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* ---------------- 자격증 심사 현황 (등록은 자격증 화면에서) ---------------- */}
      <section className="mt-5 rounded-card border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
            <Award className="size-5 shrink-0 text-fg-muted" aria-hidden />
            자격증 심사 현황
          </h2>
          <Link
            to="/mypage/certificates"
            className="text-sm font-semibold text-primary-deep underline underline-offset-4"
          >
            자격증 관리
          </Link>
        </div>

        {certificates.length === 0 ? (
          <p className="mt-3 text-base text-fg-muted">등록된 자격증이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {certificates.map((certificate) => (
              <li key={certificate.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 truncate text-base text-fg">{certificate.certificateName}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {certificate.adminReviewStatus === 'REJECTED' && certificate.adminReviewReason && (
                    <span className="text-sm text-danger">{certificate.adminReviewReason}</span>
                  )}
                  <Badge variant={STATUS_BADGE[certificate.adminReviewStatus].variant}>
                    {STATUS_BADGE[certificate.adminReviewStatus].label}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------- 경력 인증 ---------------- */}
      <section className="mt-5 rounded-card border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
              <Building2 className="size-5 shrink-0 text-fg-muted" aria-hidden />
              경력 인증
            </h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              재직증명서·경력증명서 같은 증빙 파일을 첨부하면 관리자가 확인 후 승인합니다.
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-[18px]" aria-hidden />
            경력 추가
          </Button>
        </div>

        {careers.length === 0 ? (
          <p className="mt-4 text-base text-fg-muted">등록된 경력이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {careers.map((career) => (
              <li key={career.id} className="rounded-card border border-border px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-fg">{career.organizationName}</span>
                      {career.roleTitle && (
                        <span className="text-sm text-fg-muted">{career.roleTitle}</span>
                      )}
                      <Badge variant={STATUS_BADGE[career.status].variant}>
                        {STATUS_BADGE[career.status].label}
                      </Badge>
                    </p>
                    <p className="mt-1 text-sm text-fg-muted tabular">
                      {periodLabel(career.startDate, career.endDate)}
                    </p>
                    {career.downloadUrl && (
                      <a
                        href={career.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-deep underline underline-offset-4 hover:text-primary"
                      >
                        <FileText className="size-4" aria-hidden />
                        첨부한 증빙 파일 보기
                      </a>
                    )}
                    {career.description && (
                      <p className="mt-2 text-sm whitespace-pre-line text-fg-muted">{career.description}</p>
                    )}
                    {career.status === 'REJECTED' && career.rejectReason && (
                      <p className="mt-2 text-sm text-danger">반려 사유: {career.rejectReason}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`${career.organizationName} 경력 삭제`}
                    disabled={deletingId === career.id}
                    onClick={() => handleDeleteCareer(career)}
                    className="grid size-9 shrink-0 place-items-center rounded-btn text-fg-muted hover:bg-surface-sunken hover:text-danger disabled:opacity-45"
                  >
                    <Trash2 className="size-[18px]" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------- 경력 등록 ---------------- */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title="경력 인증 신청"
        description="근무했던 기관 정보를 입력하면 관리자가 확인 후 승인합니다."
        size="sm"
      >
        <form onSubmit={handleSubmitCareer} noValidate className="space-y-4">
          <div>
            <label htmlFor="organizationName" className="mb-1.5 block text-base font-semibold text-fg">
              근무 기관
              <span className="ml-1 text-danger">*</span>
            </label>
            <Input
              id="organizationName"
              maxLength={100}
              placeholder="예) 행복요양원"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="roleTitle" className="mb-1.5 block text-base font-semibold text-fg">
              담당 업무
            </label>
            <Input
              id="roleTitle"
              maxLength={100}
              placeholder="예) 요양보호사 (선택)"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1.5 block text-base font-semibold text-fg">
                시작일
                <span className="ml-1 text-danger">*</span>
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="mb-1.5 block text-base font-semibold text-fg">
                종료일
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
              <p className="mt-1.5 text-sm text-fg-subtle">비워두면 재직중으로 표시됩니다.</p>
            </div>
          </div>

          <div>
            <label htmlFor="careerProof" className="mb-1.5 block text-base font-semibold text-fg">
              증빙 파일
              <span className="ml-1 text-danger">*</span>
            </label>
            <input
              id="careerProof"
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-base text-fg file:mr-3 file:rounded-btn file:border file:border-border-strong file:bg-surface file:px-4 file:py-2 file:text-base file:font-semibold file:text-fg hover:file:border-primary"
            />
            <p className="mt-1.5 text-sm text-fg-subtle">
              재직증명서·경력증명서 등 이미지(jpg·png) 또는 PDF, 5MB 이하
            </p>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-base font-semibold text-fg">
              설명
            </label>
            <Textarea
              id="description"
              rows={3}
              maxLength={500}
              placeholder="첨부한 증빙에 대해 덧붙일 내용이 있으면 적어주세요. (선택)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeForm}>
              취소
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? '신청 중…' : '신청하기'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/** 마크 요건 한 줄 — 충족 여부를 아이콘으로 구분한다 */
function RequirementRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2.5">
      {done ? (
        <Check className="mt-0.5 size-[18px] shrink-0 text-primary-deep" aria-hidden />
      ) : (
        <X className="mt-0.5 size-[18px] shrink-0 text-fg-subtle" aria-hidden />
      )}
      <span className="text-base">
        <strong className={done ? 'font-semibold text-fg' : 'font-semibold text-fg-muted'}>{label}</strong>
        <span className="ml-2 text-fg-muted">{detail}</span>
      </span>
    </li>
  )
}
