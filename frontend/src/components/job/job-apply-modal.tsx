import { Award, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyCertificates } from '@/api/certificates'
import { applyToJobPosting } from '@/api/applications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { CertificateFormModal } from '@/components/certificate/certificate-form'
import { ApiError } from '@/lib/api-client'
import type { CertificateDetailResponse } from '@/types/api'

interface JobApplyModalProps {
  jobId: string
  open: boolean
  onClose: () => void
  onApplied: () => void
}

/**
 * "지원하기" 확인 모달 — 메시지(선택) 입력 + 내 자격증 등록 상태 표시.
 * 지원 건에 파일을 직접 첨부하는 게 아니라(백엔드 ApplyRequest 에 그런 필드가 없다 — 자격증은
 * 이미 지원자 프로필에 등록된 것을 서버가 지원자 카드에 자동으로 붙여 보여주는 구조), 자격증이
 * 없으면 지원 직전에 그 자리에서 등록까지 마칠 수 있게 CertificateFormModal 을 인라인으로 연다.
 */
export function JobApplyModal({ jobId, open, onClose, onApplied }: JobApplyModalProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [message, setMessage] = useState('')
  const [certificates, setCertificates] = useState<CertificateDetailResponse[] | null>(null)
  const [certFormOpen, setCertFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    getMyCertificates()
      .then(setCertificates)
      .catch(() => setCertificates([]))
  }, [open])

  const handleClose = () => {
    setMessage('')
    setFormError(null)
    onClose()
  }

  const handleCertificateRegistered = (certificate: CertificateDetailResponse) => {
    setCertificates((prev) => [certificate, ...(prev ?? [])])
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setFormError(null)
    try {
      await applyToJobPosting(Number(jobId), message.trim() || undefined)
      toast({
        title: '지원이 완료되었습니다.',
        description: '마이페이지 › 지원 현황에서 진행 상황을 확인할 수 있습니다.',
      })
      onApplied()
      handleClose()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'APPLICATION_002') {
        toast({ variant: 'info', title: err.message })
        onApplied()
        handleClose()
      } else if (err instanceof ApiError && err.code === 'COMMON_002') {
        toast({
          variant: 'error',
          title: '구직 프로필을 먼저 등록해 주세요.',
          description: '지원하려면 구직신청서 작성이 필요합니다.',
        })
        handleClose()
        navigate(`/apply?jobId=${jobId}`)
      } else {
        setFormError(err instanceof ApiError ? err.message : '지원에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="지원하기"
        description="시설에 전달할 메시지를 남길 수 있습니다."
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
              취소
            </Button>
            <Button type="button" size="sm" disabled={submitting} onClick={handleSubmit}>
              {submitting ? '지원 중…' : '지원하기'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label htmlFor="apply-message" className="mb-1.5 block text-base font-semibold text-fg">
              메시지 <span className="font-normal text-fg-subtle">(선택)</span>
            </label>
            <Textarea
              id="apply-message"
              placeholder="간단한 소개나 지원 동기를 남겨보세요."
              maxLength={500}
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <div className="rounded-card border border-border bg-surface-sunken p-4">
            <p className="text-sm font-semibold text-fg">등록된 자격증</p>
            {certificates === null ? (
              <p className="mt-1.5 text-sm text-fg-muted">불러오는 중…</p>
            ) : certificates.length === 0 ? (
              <>
                <p className="mt-1.5 text-sm text-fg-muted">
                  등록된 자격증이 없습니다. 지금 등록하면 지원 시 함께 노출돼 신뢰도가 높아집니다.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() => setCertFormOpen(true)}
                >
                  <Plus className="size-4" aria-hidden />
                  자격증 등록하기
                </Button>
              </>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {certificates.map((cert) => (
                  <li key={cert.id} className="flex items-center gap-2 text-sm text-fg">
                    <Award className="size-4 shrink-0 text-fg-muted" aria-hidden />
                    <span className="min-w-0 truncate">{cert.certificateName}</span>
                    <Badge variant={cert.status === 'VERIFIED' ? 'new' : cert.status === 'REJECTED' ? 'closing' : 'normal'}>
                      {cert.status === 'VERIFIED' ? '인증완료' : cert.status === 'REJECTED' ? '반려' : '확인중'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}
        </div>
      </Modal>

      <CertificateFormModal
        open={certFormOpen}
        onClose={() => setCertFormOpen(false)}
        onRegistered={handleCertificateRegistered}
      />
    </>
  )
}
