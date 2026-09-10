import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createInquiry } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { LoginRequired, PageLoading, SupportPage, useSupportAuthGate } from './shared'

const TITLE_MAX = 200

/** 1:1 문의 작성. 로그인 필요. 첨부파일은 업로드 인프라가 없어 만들지 않는다. */
export function SupportInquiryFormPage() {
  const { user, authReady } = useSupportAuthGate()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const next: Record<string, string> = {}
    if (!title.trim()) next.title = '문의 제목을 입력해 주세요.'
    else if (title.trim().length > TITLE_MAX) next.title = `제목은 ${TITLE_MAX}자 이하로 입력해 주세요.`
    if (!content.trim()) next.content = '문의 내용을 입력해 주세요.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const res = await createInquiry({
        title: title.trim(),
        content: content.trim(),
        attachmentFileKey: null,
      })
      toast({ title: '문의가 접수되었습니다.', description: '답변이 등록되면 확인하실 수 있습니다.' })
      navigate(`/support/inquiries/${res.id}`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        setErrors(Object.fromEntries(err.fieldErrors.map((item) => [item.field, item.reason])))
      }
      setFormError(
        err instanceof ApiError ? err.message : '문의 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SupportPage
      crumbs={[{ label: '고객센터', to: '/support' }, { label: '1:1 문의' }]}
      title="1:1 문의"
      description="궁금한 점을 남겨주시면 확인 후 답변해 드립니다."
    >
      {!authReady ? (
        <PageLoading rows={1} />
      ) : !user ? (
        <LoginRequired
          from="/support/inquiry"
          description="1:1 문의는 답변을 받으실 계정이 필요해 로그인 후 이용할 수 있습니다."
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="max-w-[720px] space-y-5">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-base font-semibold text-fg">
              문의 제목
              <span className="ml-1 text-danger">*</span>
            </label>
            <Input
              id="title"
              maxLength={TITLE_MAX}
              placeholder="문의하실 내용을 한 줄로 적어주세요"
              value={title}
              invalid={Boolean(errors.title)}
              onChange={(event) => setTitle(event.target.value)}
            />
            <p className="mt-2 text-sm text-fg-subtle tabular">
              {title.length} / {TITLE_MAX}
            </p>
            {errors.title && (
              <p className="mt-2 text-sm text-danger" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="content" className="mb-1.5 block text-base font-semibold text-fg">
              문의 내용
              <span className="ml-1 text-danger">*</span>
            </label>
            <Textarea
              id="content"
              rows={10}
              placeholder="문의하실 내용을 자세히 적어주세요."
              value={content}
              invalid={Boolean(errors.content)}
              onChange={(event) => setContent(event.target.value)}
            />
            {errors.content && (
              <p className="mt-2 text-sm text-danger" role="alert">
                {errors.content}
              </p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? '접수 중…' : '문의 등록'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/support/inquiries')}
            >
              내 문의 보기
            </Button>
          </div>
        </form>
      )}
    </SupportPage>
  )
}
