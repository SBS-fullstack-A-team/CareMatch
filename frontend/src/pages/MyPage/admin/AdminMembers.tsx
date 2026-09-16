import { Search } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { searchMembers, setMemberVerifiedBadge } from '@/api/admin'
import { ApiError } from '@/lib/api-client'
import { formatNumber } from '@/lib/utils'
import type { AdminMemberSummary, MemberRole, MemberStatus, SpringPage } from '@/types/api'
import { formatServerDateTime, LoadFailed, PageLoading } from '@/pages/Support/shared'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { AdminPageHeader, AdminTotalCount } from './shared'

const PAGE_SIZE = 20

const ROLE_OPTIONS = [
  { value: '', label: '전체 유형' },
  { value: 'GENERAL', label: '보호자회원' },
  { value: 'JOBSEEKER', label: '구직회원' },
  { value: 'FACILITY', label: '시설회원' },
  { value: 'ADMIN', label: '관리자' },
]

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'SUSPENDED', label: '정지' },
  { value: 'WITHDRAWN', label: '탈퇴' },
]

const ROLE_LABEL: Record<string, string> = {
  GENERAL: '보호자회원',
  JOBSEEKER: '구직회원',
  FACILITY: '시설회원',
  ADMIN: '관리자',
}

const STATUS_BADGE: Record<string, { label: string; variant: 'new' | 'neutral' | 'closing' }> = {
  ACTIVE: { label: '활성', variant: 'new' },
  SUSPENDED: { label: '정지', variant: 'closing' },
  WITHDRAWN: { label: '탈퇴', variant: 'neutral' },
}

/** 관리자 — 회원관리. 역할/상태/키워드로 전체 회원을 검색한다. */
export function AdminMembersPage() {
  const { toast } = useToast()
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SpringPage<AdminMemberSummary> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [badgePendingId, setBadgePendingId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    searchMembers({
      role: (role || undefined) as MemberRole | undefined,
      status: (status || undefined) as MemberStatus | undefined,
      keyword: keyword || undefined,
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false))
  }, [role, status, keyword, page])

  useEffect(load, [load])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const handleToggleBadge = (member: AdminMemberSummary) => {
    const granted = !member.verifiedBadge
    setBadgePendingId(member.id)
    setMemberVerifiedBadge(member.id, granted)
      .then((updated) => {
        setData((prev) =>
          prev
            ? {
                ...prev,
                content: prev.content.map((m) => (m.id === updated.id ? updated : m)),
              }
            : prev,
        )
        toast({
          title: granted ? '인증구직자 마크를 부여했습니다.' : '인증구직자 마크를 해제했습니다.',
        })
      })
      .catch((err) => {
        toast({
          title: '처리하지 못했습니다.',
          description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
          variant: 'error',
        })
      })
      .finally(() => setBadgePendingId(null))
  }

  return (
    <div>
      <AdminPageHeader title="회원관리" description="가입한 회원들의 정보를 확인할 수 있습니다." />

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
        <div className="w-full sm:w-40">
          <label className="mb-1.5 block text-sm font-semibold text-fg">회원 유형</label>
          <Select
            options={ROLE_OPTIONS.slice(1)}
            placeholder={ROLE_OPTIONS[0].label}
            value={role}
            onChange={(event) => {
              setPage(1)
              setRole(event.target.value)
            }}
          />
        </div>
        <div className="w-full sm:w-36">
          <label className="mb-1.5 block text-sm font-semibold text-fg">상태</label>
          <Select
            options={STATUS_OPTIONS.slice(1)}
            placeholder={STATUS_OPTIONS[0].label}
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value)
            }}
          />
        </div>
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-end gap-2">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-fg">검색</label>
            <Input
              placeholder="이름·아이디·이메일·연락처"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" className="shrink-0">
            <Search className="size-4" aria-hidden />
            검색
          </Button>
        </form>
      </div>

      <div className="mt-5">
        {loading ? (
          <PageLoading rows={6} />
        ) : error ? (
          <LoadFailed message={error} onRetry={load} />
        ) : !data || data.content.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState title="조건에 맞는 회원이 없습니다." />
          </div>
        ) : (
          <>
            <AdminTotalCount count={data.totalElements} />

            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-fg-muted">
                    <th className="px-4 py-3 font-semibold">이름</th>
                    <th className="px-4 py-3 font-semibold">아이디</th>
                    <th className="px-4 py-3 font-semibold">이메일</th>
                    <th className="px-4 py-3 font-semibold">연락처</th>
                    <th className="px-4 py-3 font-semibold">유형</th>
                    <th className="px-4 py-3 font-semibold">상태</th>
                    <th className="px-4 py-3 text-right font-semibold">포인트</th>
                    <th className="px-4 py-3 font-semibold">가입일</th>
                    <th className="px-4 py-3 font-semibold">인증구직자</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((member) => {
                    const statusBadge = STATUS_BADGE[member.status]
                    const isJobseeker = member.role === 'JOBSEEKER'
                    return (
                      <tr key={member.id} className="border-b border-border last:border-b-0 hover:bg-primary-light/20">
                        <td className="px-4 py-3 font-semibold text-fg">{member.name}</td>
                        <td className="px-4 py-3 text-fg-muted">{member.loginId ?? '-'}</td>
                        <td className="px-4 py-3 text-fg-muted">{member.email}</td>
                        <td className="px-4 py-3 text-fg-muted">{member.phone ?? '-'}</td>
                        <td className="px-4 py-3 text-fg-muted">
                          {member.role ? (ROLE_LABEL[member.role] ?? member.role) : '유형 미선택'}
                        </td>
                        <td className="px-4 py-3">
                          {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right tabular text-fg">{formatNumber(member.point)}P</td>
                        <td className="px-4 py-3 text-fg-subtle tabular">{formatServerDateTime(member.createdAt)}</td>
                        <td className="px-4 py-3">
                          {isJobseeker ? (
                            <div className="flex items-center gap-2">
                              {member.verifiedBadge && <Badge variant="new">인증됨</Badge>}
                              <Button
                                type="button"
                                size="sm"
                                variant={member.verifiedBadge ? 'secondary' : 'primary'}
                                disabled={badgePendingId === member.id}
                                onClick={() => handleToggleBadge(member)}
                              >
                                {member.verifiedBadge ? '마크 해제' : '마크 활성화'}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-fg-subtle">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </div>
  )
}
