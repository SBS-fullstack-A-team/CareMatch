import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/common/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { getFaqs } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import type { FaqResponse } from '@/types/api'
import { LoadFailed, PageLoading, SupportPage } from './shared'

const ALL = '전체'

/**
 * 자주 묻는 질문.
 * 아코디언 공통 컴포넌트가 없어 네이티브 details/summary 를 쓴다 (키보드·스크린리더 기본 지원).
 * 검색은 서버에 파라미터가 없어 만들지 않는다.
 */
export function SupportFaqPage() {
  const [faqs, setFaqs] = useState<FaqResponse[]>([])
  const [category, setCategory] = useState<string>(ALL)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getFaqs()
      .then(setFaqs)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  /** 카테고리는 서버에 목록 API 가 없어 응답에서 뽑아 쓴다 */
  const categories = useMemo(
    () => [ALL, ...new Set(faqs.map((faq) => faq.category))],
    [faqs],
  )

  const visible = useMemo(
    () =>
      (category === ALL ? faqs : faqs.filter((faq) => faq.category === category))
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [faqs, category],
  )

  return (
    <SupportPage
      crumbs={[{ label: '고객센터', to: '/support' }, { label: '자주 묻는 질문' }]}
      title="자주 묻는 질문"
      description="이용 중 자주 문의하시는 내용을 모았습니다."
    >
      {loading ? (
        <PageLoading rows={4} />
      ) : error ? (
        <LoadFailed message={error} onRetry={load} />
      ) : faqs.length === 0 ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState
            title="등록된 질문이 없습니다."
            description="궁금한 점은 1:1 문의로 남겨주세요."
          />
        </div>
      ) : (
        <>
          {categories.length > 2 && (
            <SegmentedControl
              className="mb-5"
              items={categories.map((value) => ({ value, label: value }))}
              value={category}
              onChange={setCategory}
            />
          )}

          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {visible.map((faq) => (
              <li key={faq.id} className="border-b border-border last:border-b-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-light/40">
                    <span className="min-w-0">
                      <span className="text-sm text-fg-muted">{faq.category}</span>
                      <span className="mt-0.5 block text-base font-semibold text-fg">
                        {faq.question}
                      </span>
                    </span>
                    <ChevronDown
                      className="mt-1 size-5 shrink-0 text-fg-subtle transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t border-border bg-surface-sunken px-6 py-4">
                    <p className="text-base leading-relaxed whitespace-pre-line text-fg-muted">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </SupportPage>
  )
}
