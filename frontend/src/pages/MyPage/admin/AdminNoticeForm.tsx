import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createNotice, updateNotice } from '@/api/admin'
import { getNoticeDetail } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { PageLoading } from '@/pages/Support/shared'

/** 관리자 — 공지사항 작성/수정. :noticeId 가 있으면 수정 모드. */
export function AdminNoticeFormPage() {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const editing = Boolean(noticeId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!editing || !noticeId) return
    setLoading(true)
    getNoticeDetail(noticeId)
      .then((notice) => {
        setTitle(notice.title)
        setContent(notice.content)
        setPinned(notice.pinned)
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : '공지를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [editing, noticeId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const nextErrors: { title?: string; content?: string } = {}
    if (!title.trim()) nextErrors.title = '제목을 입력해 주세요.'
    else if (title.trim().length > 200) nextErrors.title = '제목은 200자 이하로 입력해 주세요.'
    if (!content.trim()) nextErrors.content = '내용을 입력해 주세요.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const req = { title: title.trim(), content: content.trim(), pinned }
      if (editing && noticeId) {
        await updateNotice(noticeId, req)
        toast({ title: '공지사항을 수정했습니다.' })
      } else {
        await createNotice(req)
        toast({ title: '공지사항을 등록했습니다.' })
      }
      navigate('/mypage/admin/notices')
    } catch (err) {
      toast({
        variant: 'error',
        title: '저장에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="mb-5 text-2xl font-bold text-fg">{editing ? '공지사항 수정' : '공지사항 작성'}</h1>
        <PageLoading rows={3} />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-fg">{editing ? '공지사항 수정' : '공지사항 작성'}</h1>

      {loadError && (
        <p className="mb-4 text-sm text-danger" role="alert">
          {loadError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="notice-title" className="mb-1.5 block text-base font-semibold text-fg">
            제목
            <span className="ml-1 text-danger">*</span>
          </label>
          <Input
            id="notice-title"
            placeholder="공지 제목을 입력해 주세요."
            maxLength={200}
            value={title}
            invalid={Boolean(errors.title)}
            onChange={(event) => {
              setTitle(event.target.value)
              setErrors((prev) => ({ ...prev, title: undefined }))
            }}
          />
          {errors.title && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="notice-content" className="mb-1.5 block text-base font-semibold text-fg">
            내용
            <span className="ml-1 text-danger">*</span>
          </label>
          <Textarea
            id="notice-content"
            rows={10}
            placeholder="공지 내용을 입력해 주세요."
            value={content}
            invalid={Boolean(errors.content)}
            onChange={(event) => {
              setContent(event.target.value)
              setErrors((prev) => ({ ...prev, content: undefined }))
            }}
          />
          {errors.content && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {errors.content}
            </p>
          )}
        </div>

        <Checkbox
          label="상단 고정"
          hint="목록 맨 위에 고정 표시됩니다."
          checked={pinned}
          onChange={(event) => setPinned(event.target.checked)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/mypage/admin/notices')}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '저장 중…' : editing ? '수정하기' : '등록하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
