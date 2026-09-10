import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { getInquiryDetail } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { InquiryResponse } from '@/types/api'
import {
  formatServerDateTime,
  LoginRequired,
  PageLoading,
  SupportPage,
  useSupportAuthGate,
} from './shared'
import { InquiryStatusBadge } from './status-badge'

/** 내 문의 상세 + 답변. 수정/삭제는 서버 API 가 없어 만들지 않는다. */
export function SupportInquiryDetailPage() {
  const { inquiryId } = useParams()
  const { user, authReady } = useSupportAuthGate()
  const [inquiry, setInquiry] = useState<InquiryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!inquiryId || !user) return
    setLoading(true)
    setError(null)
    getInquiryDetail(inquiryId)
      .then(setInquiry)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
          setError('요청하신 문의를 찾을 수 없거나 열람 권한이 없습니다.')
        } else {
          setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.')
        }
      })
      .finally(() => setLoading(false))
  }, [inquiryId, user])

  useEffect(() => {
    if (authReady && user) load()
  }, [authReady, user, load])

  return (
    <SupportPage
      crumbs={[
        { label: '고객센터', to: '/support' },
        { label: '내 문의', to: '/support/inquiries' },
        { label: '문의 상세' },
      ]}
      title="내 문의"
    >
      {!authReady ? (
        <PageLoading rows={1} />
      ) : !user ? (
        <LoginRequired
          from={`/support/inquiries/${inquiryId ?? ''}`}
          description="문의 내용은 로그인 후 확인할 수 있습니다."
        />
      ) : loading ? (
        <PageLoading rows={1} />
      ) : error || !inquiry ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState
            title="문의를 찾을 수 없습니다."
            description={error ?? undefined}
            action={
              <Link
                to="/support/inquiries"
                className={cn(buttonVariants({ variant: 'secondary' }))}
              >
                내 문의 목록으로
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <article className="rounded-card border border-border bg-surface p-6 lg:p-8">
            <header className="border-b border-border pb-5">
              <InquiryStatusBadge status={inquiry.status} />
              <h2 className="mt-2.5 text-2xl font-bold text-fg">{inquiry.title}</h2>
              <p className="mt-3 text-xs text-fg-subtle tabular">
                등록일 {formatServerDateTime(inquiry.createdAt)}
              </p>
            </header>

            <div className="pt-6">
              <p className="text-base leading-relaxed whitespace-pre-line text-fg">
                {inquiry.content}
              </p>
            </div>
          </article>

          {/* 답변 */}
          <section className="mt-5">
            <h3 className="text-xl font-bold text-fg">답변</h3>

            {inquiry.replies.length === 0 ? (
              <div className="mt-4 rounded-card border border-border bg-surface px-6 py-8 text-center">
                <p className="text-base text-fg-muted">답변을 기다리고 있습니다.</p>
                <p className="mt-1 text-base text-fg-subtle">
                  확인 후 순차적으로 답변해 드리고 있습니다.
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {inquiry.replies.map((reply) => (
                  <li
                    key={reply.id}
                    className="rounded-card border border-primary/35 bg-primary-light/60 p-6"
                  >
                    <p className="flex items-center gap-2 text-base font-bold text-primary-deep">
                      <MessageSquare className="size-[18px] shrink-0" aria-hidden />
                      케어매치 고객센터
                    </p>
                    <p className="mt-3 text-base leading-relaxed whitespace-pre-line text-fg">
                      {reply.content}
                    </p>
                    <p className="mt-3 text-xs text-fg-subtle tabular">
                      {formatServerDateTime(reply.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-6 flex justify-center">
            <Link
              to="/support/inquiries"
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              목록으로 돌아가기
            </Link>
          </div>
        </>
      )}
    </SupportPage>
  )
}
