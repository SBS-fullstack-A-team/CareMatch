import { Info, Paperclip } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { createCertificate, verifyCertificate } from '@/api/certificates'
import { updateMyPhone } from '@/api/members'
import { sendVerificationCode, verifyCode } from '@/api/verifications'
import { CERTIFICATE_OPTIONS } from '@/data/filters'
import { ApiError } from '@/lib/api-client'
import { ACCEPT_ATTR, FileUploadError, uploadFile } from '@/lib/file-upload'
import type { CertificateDetailResponse } from '@/types/api'

const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/
const FORM_ID = 'certificate-form'

interface CertificateFormModalProps {
  open: boolean
  onClose: () => void
  /** 등록(및 등록 직후 검증)까지 끝난 자격증. status 가 REJECTED 일 수도 있다. */
  onRegistered: (certificate: CertificateDetailResponse) => void
}

/**
 * 자격증 추가 모달 — 파일/사진 첨부 후 등록.
 * 최초 등록(=요양보호사 등록) 시점엔 휴대폰 인증이 필요하다(CertificateService#register).
 * 미인증이면 서버가 MEMBER_005 로 거절 → 이 화면에서 바로 인증까지 마치고 재시도할 수 있게 한다.
 */
export function CertificateFormModal({ open, onClose, onRegistered }: CertificateFormModalProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [certificateType, setCertificateType] = useState('')
  const [certificateName, setCertificateName] = useState('')
  const [certificateNumber, setCertificateNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)
  /** 업로드까지 마친 fileKey. 휴대폰 인증 실패로 재시도할 때 파일을 다시 올리지 않으려고 캐시한다. */
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ---- 휴대폰 인증 (등록이 MEMBER_005 로 거절됐을 때만 보인다) ----
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const resetAndClose = () => {
    setCertificateType('')
    setCertificateName('')
    setCertificateNumber('')
    setFile(null)
    setUploadedFileKey(null)
    setFormError(null)
    setNeedsPhoneVerification(false)
    setPhone('')
    setCode('')
    setCodeSent(false)
    setPhoneError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null
    setFile(next)
    // 파일이 바뀌면 이전에 올려둔 fileKey는 더 이상 유효하지 않다
    setUploadedFileKey(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!certificateType) {
      setFormError('자격증 종류를 선택해 주세요.')
      return
    }
    if (certificateType === 'OTHER' && !certificateName.trim()) {
      setFormError('자격증 이름을 입력해 주세요.')
      return
    }
    if (!file && !uploadedFileKey) {
      setFormError('자격증 파일(사진 또는 PDF)을 첨부해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      let fileKey = uploadedFileKey
      if (!fileKey) {
        const uploaded = await uploadFile(file!, 'CERTIFICATE')
        fileKey = uploaded.fileKey
        setUploadedFileKey(fileKey)
      }

      const created = await createCertificate({
        certificateType,
        certificateName: certificateType === 'OTHER' ? certificateName.trim() : undefined,
        certificateNumber: certificateNumber.trim() || undefined,
        fileKey,
      })
      // 등록 직후 한 번 검증까지 시도한다. 검증 자체가 실패해도 등록은 이미 됐으니 그대로 반영.
      const finalCertificate = await verifyCertificate(created.id).catch(() => created)

      if (finalCertificate.status === 'REJECTED') {
        toast({
          variant: 'error',
          title: '자격증이 반려되었습니다.',
          description: finalCertificate.rejectReason ?? undefined,
        })
      } else {
        toast({ title: '자격증을 등록했습니다.' })
      }
      onRegistered(finalCertificate)
      resetAndClose()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'MEMBER_005') {
        setNeedsPhoneVerification(true)
        setFormError('자격증 등록은 휴대폰 인증이 필요합니다. 아래에서 인증을 마친 뒤 다시 눌러 주세요.')
      } else if (err instanceof FileUploadError || err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('자격증 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendPhoneCode = async () => {
    if (!PHONE_RE.test(phone.trim())) {
      setPhoneError('휴대폰 번호 형식이 올바르지 않습니다.')
      return
    }
    setPhoneError(null)
    setSendingCode(true)
    try {
      await updateMyPhone(phone.trim())
      const res = await sendVerificationCode({ channel: 'PHONE', target: phone.trim() })
      setCodeSent(true)
      toast({
        title: '인증코드를 발송했습니다.',
        description: res.devCodeHint ? `개발 환경 인증코드: ${res.devCodeHint}` : undefined,
      })
    } catch (err) {
      setPhoneError(err instanceof ApiError ? err.message : '인증코드 발송에 실패했습니다.')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyPhoneCode = async () => {
    if (!code.trim()) {
      setPhoneError('인증번호를 입력해 주세요.')
      return
    }
    setPhoneError(null)
    setVerifyingCode(true)
    try {
      const res = await verifyCode({ channel: 'PHONE', target: phone.trim(), code: code.trim() })
      if (res.verified) {
        setNeedsPhoneVerification(false)
        setFormError('휴대폰 인증이 완료됐습니다. "등록하기"를 다시 눌러 주세요.')
        toast({ title: '휴대폰 인증이 완료되었습니다.' })
      } else {
        setPhoneError('인증번호가 올바르지 않습니다.')
      }
    } catch (err) {
      setPhoneError(err instanceof ApiError ? err.message : '인증에 실패했습니다.')
    } finally {
      setVerifyingCode(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="자격증 추가"
      description="자격증 종류를 선택하고 사진 또는 PDF 파일을 첨부해 주세요."
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={resetAndClose}>
            취소
          </Button>
          <Button type="submit" form={FORM_ID} size="sm" disabled={submitting}>
            {submitting ? '등록 중…' : '등록하기'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-5 py-2">
        <div>
          <label htmlFor="certificate-type" className="mb-1.5 block text-base font-semibold text-fg">
            자격증 종류
          </label>
          <Select
            id="certificate-type"
            placeholder="종류를 선택하세요"
            options={CERTIFICATE_OPTIONS}
            value={certificateType}
            onChange={(event) => setCertificateType(event.target.value)}
          />
        </div>

        {certificateType === 'OTHER' && (
          <div>
            <label htmlFor="certificate-name" className="mb-1.5 block text-base font-semibold text-fg">
              자격증 이름
            </label>
            <Input
              id="certificate-name"
              placeholder="예) 심폐소생술 강사"
              value={certificateName}
              onChange={(event) => setCertificateName(event.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor="certificate-number" className="mb-1.5 block text-base font-semibold text-fg">
            자격증 번호 <span className="font-normal text-fg-subtle">(선택)</span>
          </label>
          <Input
            id="certificate-number"
            placeholder="예) 12-345678"
            value={certificateNumber}
            onChange={(event) => setCertificateNumber(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="certificate-file" className="mb-1.5 block text-base font-semibold text-fg">
            자격증 파일
          </label>
          <label
            htmlFor="certificate-file"
            className="flex h-12 cursor-pointer items-center gap-2 rounded-input border border-dashed border-border-strong bg-surface px-4 text-base text-fg-muted hover:border-primary hover:text-primary-deep"
          >
            <Paperclip className="size-[18px] shrink-0" aria-hidden />
            <span className="truncate">{file ? file.name : '사진(jpg, png) 또는 PDF 파일 선택'}</span>
          </label>
          <input
            ref={fileInputRef}
            id="certificate-file"
            type="file"
            accept={ACCEPT_ATTR}
            onChange={handleFileChange}
            className="sr-only"
          />
          <p className="mt-1.5 text-sm text-fg-subtle">5MB 이하 jpg, png, pdf 파일만 첨부할 수 있습니다.</p>
        </div>

        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}

        {needsPhoneVerification && (
          <div className="space-y-3 rounded-card border border-border bg-surface-sunken p-4">
            <p className="flex items-start gap-2 text-sm text-fg-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              자격증은 요양보호사 등록 절차라 휴대폰 인증이 한 번 필요합니다.
            </p>

            <div className="flex gap-2">
              <Input
                aria-label="휴대폰 번호"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                disabled={sendingCode}
                onClick={handleSendPhoneCode}
              >
                {sendingCode ? '발송 중…' : codeSent ? '재발송' : '인증번호 받기'}
              </Button>
            </div>

            {codeSent && (
              <div className="flex gap-2">
                <Input
                  aria-label="인증번호"
                  placeholder="인증번호 6자리"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  disabled={verifyingCode}
                  onClick={handleVerifyPhoneCode}
                >
                  {verifyingCode ? '확인 중…' : '확인'}
                </Button>
              </div>
            )}

            {phoneError && (
              <p className="text-sm text-danger" role="alert">
                {phoneError}
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}
