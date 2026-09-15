import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { replyToInquiry } from '@/api/admin'
import { getInquiryDetail } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import type { InquiryResponse } from '@/types/api'
import { formatServerDateTime, PageLoading } from '@/pages/Support/shared'
import { InquiryStatusBadge } from '@/pages/Support/status-badge'
import { EmptyState } from '@/components/common/empty-state'

/** 관리자 — 문의 상세 + 답변 등록. 답변은 여러 번 남길 수 있다(추가 문의 대응). */
export function AdminInquiryDetailPage() {
  const { inquiryId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [inquiry, setInquiry] = useState<InquiryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    if (!inquiryId) return
    setLoading(true)
    setError(null)
    getInquiryDetail(inquiryId)
      .then(setInquiry)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'),
      )
      .finally(() => setLoading(false))
  }, [inquiryId])

  useEffect(load, [load])

  const handleReply = async () => {
    if (!inquiryId || !replyContent.trim()) return
    setSubmitting(true)
    try {
      const updated = await replyToInquiry(Number(inquiryId), { content: replyContent.trim() })
      setInquiry(updated)
      setReplyContent('')
      toast({ title: '답변을 등록했습니다.' })
    } catch (err) {
      toast({
        variant: 'error',
        title: '답변 등록에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-fg">문의 상세</h1>
      </div>

      {loading ? (
        <PageLoading rows={2} />
      ) : error || !inquiry ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState
            title="문의를 찾을 수 없습니다."
            description={error ?? undefined}
            action={
              <Link
                to="/mypage/admin/inquiries"
                className="text-sm font-semibold text-primary-deep underline underline-offset-4"
              >
                목록으로
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
              <p className="mt-2 text-sm text-fg-muted">
                {inquiry.memberName ?? '탈퇴/비회원'}
                {inquiry.memberEmail && ` · ${inquiry.memberEmail}`}
              </p>
              <p className="mt-1 text-xs text-fg-subtle tabular">
                등록일 {formatServerDateTime(inquiry.createdAt)}
              </p>
            </header>

            <div className="pt-6">
              <p className="text-base leading-relaxed whitespace-pre-line text-fg">{inquiry.content}</p>
            </div>
          </article>

          <section className="mt-5">
            <h3 className="text-xl font-bold text-fg">답변</h3>

            {inquiry.replies.length === 0 ? (
              <div className="mt-4 rounded-card border border-border bg-surface px-6 py-8 text-center">
                <p className="text-base text-fg-muted">아직 등록된 답변이 없습니다.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {inquiry.replies.map((reply) => (
                  <li key={reply.id} className="rounded-card border border-primary/35 bg-primary-light/60 p-6">
                    <p className="flex items-center gap-2 text-base font-bold text-primary-deep">
                      <MessageSquare className="size-[18px] shrink-0" aria-hidden />
                      관리자
                    </p>
                    <p className="mt-3 text-base leading-relaxed whitespace-pre-line text-fg">{reply.content}</p>
                    <p className="mt-3 text-xs text-fg-subtle tabular">{formatServerDateTime(reply.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 rounded-card border border-border bg-surface p-5">
              <label className="mb-1.5 block text-sm font-semibold text-fg">답변 작성</label>
              <Textarea
                rows={5}
                placeholder="회원에게 전달할 답변을 입력해 주세요."
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <Button type="button" disabled={!replyContent.trim() || submitting} onClick={handleReply}>
                  {submitting ? '등록 중…' : '답변 등록'}
                </Button>
              </div>
            </div>
          </section>

          <div className="mt-6 flex justify-center">
            <Button type="button" variant="secondary" onClick={() => navigate('/mypage/admin/inquiries')}>
              목록으로 돌아가기
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
