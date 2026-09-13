import { Award, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { CertificateFormModal } from '@/components/certificate/certificate-form'
import { deleteCertificate, getMyCertificates } from '@/api/certificates'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { ApiError } from '@/lib/api-client'
import { LoadFailed } from '@/pages/Support/shared'
import type { CertificateDetailResponse, CertificateStatus } from '@/types/api'

const STATUS_BADGE: Record<CertificateStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: '확인중', variant: 'normal' },
  VERIFIED: { label: '인증완료', variant: 'new' },
  REJECTED: { label: '반려', variant: 'closing' },
}

const EMPTY_LIST: CertificateDetailResponse[] = []

/** `/mypage/certificates` — 구직자 전용. 등록(파일/사진 첨부)·삭제까지 지원한다. */
export function MyPageCertificatesPage() {
  const { user } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isJobSeeker = user?.role === 'JOBSEEKER'

  const { data, loading, error, reload } = useAsync(
    () => (isJobSeeker ? getMyCertificates() : Promise.resolve(EMPTY_LIST)),
    [isJobSeeker],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /** 회원가입 직후 "지금 자격증 등록하기"로 넘어온 경우, 도착하자마자 등록창을 띄운다 */
  useEffect(() => {
    const state = location.state as { openCertificateForm?: boolean } | null
    if (state?.openCertificateForm) {
      setFormOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (certificate: CertificateDetailResponse) => {
    if (!window.confirm(`'${certificate.certificateName}' 자격증을 삭제할까요?`)) return
    setDeletingId(certificate.id)
    try {
      await deleteCertificate(certificate.id)
      toast({ title: '자격증을 삭제했습니다.' })
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

  if (!isJobSeeker) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          title="구직자 전용 화면입니다."
          description="자격증 등록·확인은 구직회원만 이용할 수 있습니다."
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">자격증</h1>
          <p className="mt-2 text-base text-fg-muted">인재정보에 노출되는 자격증 목록입니다.</p>
        </div>
        <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-[18px]" aria-hidden />
          자격증 추가
        </Button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="overflow-hidden rounded-card border border-border">
            <LoadingState rows={3} />
          </div>
        ) : error ? (
          <LoadFailed message={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState
              title="등록된 자격증이 없습니다."
              description="자격증 사진이나 PDF 파일을 첨부해 등록해 보세요."
              action={
                <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
                  자격증 추가
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {data.map((cert) => (
              <li
                key={cert.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Award className="size-[18px] shrink-0 text-fg-muted" aria-hidden />
                  <span className="truncate text-base text-fg">{cert.certificateName}</span>
                  {cert.certificateNumber && (
                    <span className="shrink-0 text-sm text-fg-subtle">{cert.certificateNumber}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {cert.downloadUrl && (
                    <a
                      href={cert.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary-deep underline underline-offset-2"
                    >
                      파일 보기
                    </a>
                  )}
                  <Badge variant={STATUS_BADGE[cert.status].variant}>{STATUS_BADGE[cert.status].label}</Badge>
                  <button
                    type="button"
                    aria-label={`${cert.certificateName} 삭제`}
                    disabled={deletingId === cert.id}
                    onClick={() => handleDelete(cert)}
                    className="grid size-9 shrink-0 place-items-center rounded-btn text-fg-muted hover:bg-surface-sunken hover:text-danger disabled:opacity-45"
                  >
                    <Trash2 className="size-[18px]" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CertificateFormModal open={formOpen} onClose={() => setFormOpen(false)} onRegistered={() => reload()} />
    </div>
  )
}
