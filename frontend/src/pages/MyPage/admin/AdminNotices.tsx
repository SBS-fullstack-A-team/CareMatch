import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { deleteNotice } from '@/api/admin'
import { getNotices } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { cn, formatNumber } from '@/lib/utils'
import type { NoticeSummary, SpringPage } from '@/types/api'
import { formatServerDate, LoadFailed, PageLoading } from '@/pages/Support/shared'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { AdminPageHeader, AdminTotalCount } from './shared'

const PAGE_SIZE = 10

/** 관리자 — 공지사항. 목록 + 작성/수정/삭제. */
export function AdminNoticesPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<NoticeSummary> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NoticeSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getNotices(page - 1, PAGE_SIZE)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(load, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteNotice(deleteTarget.id)
      toast({ title: '공지사항을 삭제했습니다.' })
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="공지사항"
        description="서비스 공지사항을 작성·수정·삭제할 수 있습니다."
        action={
          <Link to="/mypage/admin/notices/new" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
            <Plus className="size-4" aria-hidden />
            새 공지 작성
          </Link>
        }
      />

      {loading ? (
        <PageLoading rows={5} />
      ) : error ? (
        <LoadFailed message={error} onRetry={load} />
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState title="등록된 공지가 없습니다." />
        </div>
      ) : (
        <>
          <AdminTotalCount count={data.totalElements} />

          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {data.content.map((notice) => (
              <li
                key={notice.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {notice.pinned && <Badge variant="normal">공지</Badge>}
                  <span className="truncate text-base text-fg">{notice.title}</span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-fg-subtle tabular">
                    <Eye className="size-4" aria-hidden />
                    {formatNumber(notice.viewCount)}
                  </span>
                  <span className="text-xs text-fg-subtle tabular">{formatServerDate(notice.createdAt)}</span>
                  <Link
                    to={`/mypage/admin/notices/${notice.id}/edit`}
                    aria-label="수정"
                    className="grid size-9 place-items-center rounded-btn text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    aria-label="삭제"
                    onClick={() => setDeleteTarget(notice)}
                    className="grid size-9 place-items-center rounded-btn text-fg-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />
        </>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="공지사항 삭제"
        description={deleteTarget ? `"${deleteTarget.title}"을(를) 삭제하시겠습니까?` : undefined}
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button type="button" size="sm" disabled={deleting} onClick={handleDelete}>
              {deleting ? '삭제 중…' : '삭제하기'}
            </Button>
          </>
        }
      />
    </div>
  )
}
