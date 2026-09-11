import { Award, Info } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { getMyCertificates } from '@/api/certificates'
import { useApp } from '@/hooks/use-app'
import { useAsync } from '@/hooks/use-async'
import { LoadFailed } from '@/pages/Support/shared'
import type { CertificateDetailResponse, CertificateStatus } from '@/types/api'

const STATUS_BADGE: Record<CertificateStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: '확인중', variant: 'normal' },
  VERIFIED: { label: '인증완료', variant: 'new' },
  REJECTED: { label: '반려', variant: 'closing' },
}

const EMPTY_LIST: CertificateDetailResponse[] = []

/** `/mypage/certificates` — 구직자 전용, 읽기 전용 목록. 등록/재검증은 파일 업로드 연동 후 제공. */
export function MyPageCertificatesPage() {
  const { user } = useApp()
  const isJobSeeker = user?.role === 'JOBSEEKER'

  const { data, loading, error, reload } = useAsync(
    () => (isJobSeeker ? getMyCertificates() : Promise.resolve(EMPTY_LIST)),
    [isJobSeeker],
  )

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
      <h1 className="text-2xl font-bold text-fg">자격증</h1>
      <p className="mt-2 text-base text-fg-muted">인재정보에 노출되는 자격증 목록입니다.</p>

      <div className="mt-4 flex gap-2.5 rounded-card border border-border bg-surface px-5 py-4">
        <Info className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
        <p className="text-base text-fg-muted">
          자격증 추가·재확인은 파일 업로드 연동 후 제공될 예정입니다.
        </p>
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
            <EmptyState title="등록된 자격증이 없습니다." />
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
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
