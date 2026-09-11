import { getTermsDetail } from '@/api/terms'
import { useAsync } from '@/hooks/use-async'
import { LoadFailed, PageLoading, SupportPage } from '@/pages/Support/shared'
import type { TermsTypeName } from '@/types/api'

const TITLE: Record<Extract<TermsTypeName, 'SERVICE' | 'PRIVACY'>, string> = {
  SERVICE: '이용약관',
  PRIVACY: '개인정보처리방침',
}

/**
 * `/terms`, `/privacy` — 공개 API `GET /api/terms/{type}` 를 그대로 보여준다.
 * (구인공고·인재처럼 mock 이 필요 없는, 백엔드가 이미 완비한 화면)
 */
export function LegalPage({ type }: { type: 'SERVICE' | 'PRIVACY' }) {
  const { data, loading, error, reload } = useAsync(() => getTermsDetail(type), [type])

  return (
    <SupportPage crumbs={[{ label: TITLE[type] }]} title={data?.title ?? TITLE[type]}>
      {loading ? (
        <PageLoading rows={4} />
      ) : error ? (
        <LoadFailed message={error} onRetry={reload} />
      ) : (
        <article className="rounded-card border border-border bg-surface p-6 whitespace-pre-wrap text-base text-fg">
          {data?.content}
        </article>
      )}
    </SupportPage>
  )
}
