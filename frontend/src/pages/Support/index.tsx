import { ChevronRight, Clock, HelpCircle, Megaphone, MessageSquare, Phone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/common/section-header'
import { Badge } from '@/components/ui/badge'
import { getFaqs, getNotices, getSiteConfig } from '@/api/support'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { FaqResponse, NoticeSummary, SiteConfigResponse } from '@/types/api'
import { formatServerDate, LoadFailed, PageLoading, SupportPage } from './shared'

const QUICK_LINKS = [
  {
    to: '/support/faq',
    icon: HelpCircle,
    title: '자주 묻는 질문',
    description: '많이 묻는 내용을 모았습니다.',
  },
  {
    to: '/support/notice',
    icon: Megaphone,
    title: '공지사항',
    description: '서비스 소식과 안내를 확인하세요.',
  },
  {
    to: '/support/inquiry',
    icon: MessageSquare,
    title: '1:1 문의',
    description: '직접 문의를 남겨주세요.',
  },
]

/** 고객센터 메인 — 어디로 갈지 빠르게 고르는 허브 */
export function SupportHomePage() {
  const [faqs, setFaqs] = useState<FaqResponse[]>([])
  const [notices, setNotices] = useState<NoticeSummary[]>([])
  const [config, setConfig] = useState<SiteConfigResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getFaqs(), getNotices(0, 5), getSiteConfig()])
      .then(([faqList, noticePage, siteConfig]) => {
        setFaqs(faqList.slice(0, 5))
        setNotices(noticePage.content)
        setConfig(siteConfig)
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  return (
    <SupportPage
      crumbs={[{ label: '고객센터' }]}
      title="고객센터"
      description="궁금한 점을 빠르게 해결해 드립니다."
    >
      {/* 빠른 도움 */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map(({ to, icon: Icon, title, description }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-full items-start gap-3.5 rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/40"
            >
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-[8px] bg-primary-light text-primary-deep"
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold text-fg">{title}</span>
                <span className="mt-1 block text-base text-fg-muted">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="mt-10">
          <PageLoading rows={3} />
        </div>
      ) : error ? (
        <div className="mt-10">
          <LoadFailed message={error} onRetry={load} />
        </div>
      ) : (
        <>
          {/* 자주 묻는 질문 */}
          <section className="mt-10 lg:mt-12">
            <SectionHeader title="자주 묻는 질문" moreHref="/support/faq" moreLabel="전체보기" />
            <div className="mt-5 rounded-card border border-border bg-surface">
              {faqs.length === 0 ? (
                <p className="px-6 py-10 text-center text-base text-fg-muted">
                  등록된 질문이 없습니다.
                </p>
              ) : (
                <ul>
                  {faqs.map((faq) => (
                    <li key={faq.id} className="border-b border-border last:border-b-0">
                      <Link
                        to="/support/faq"
                        className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-light/40"
                      >
                        <span className="min-w-0">
                          <span className="text-sm text-fg-muted">{faq.category}</span>
                          <span className="mt-0.5 block truncate text-base text-fg">
                            {faq.question}
                          </span>
                        </span>
                        <ChevronRight className="size-[18px] shrink-0 text-fg-subtle" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* 공지사항 */}
          <section className="mt-10 lg:mt-12">
            <SectionHeader title="공지사항" moreHref="/support/notice" moreLabel="전체보기" />
            <div className="mt-5 rounded-card border border-border bg-surface">
              {notices.length === 0 ? (
                <p className="px-6 py-10 text-center text-base text-fg-muted">
                  등록된 공지가 없습니다.
                </p>
              ) : (
                <ul>
                  {notices.map((notice) => (
                    <li key={notice.id} className="border-b border-border last:border-b-0">
                      <Link
                        to={`/support/notice/${notice.id}`}
                        className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-light/40"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {notice.pinned && <Badge variant="normal">공지</Badge>}
                          <span className="truncate text-base text-fg">{notice.title}</span>
                        </span>
                        <span className="shrink-0 text-xs text-fg-subtle tabular">
                          {formatServerDate(notice.createdAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* 고객센터 안내 */}
          {config && (
            <section className="mt-10 lg:mt-12">
              <SectionHeader title="고객센터 안내" />
              <div className="mt-5 rounded-card border border-border bg-surface p-6">
                <p className="flex items-center gap-2">
                  <Phone className="size-5 shrink-0 text-primary" aria-hidden />
                  <a
                    href={`tel:${config.tel.replaceAll('-', '')}`}
                    className="text-3xl font-bold text-fg tabular hover:text-primary-deep"
                  >
                    {config.tel}
                  </a>
                </p>

                <p className="mt-3 flex items-center gap-2 text-base text-fg-muted">
                  <Clock className="size-5 shrink-0 text-fg-subtle" aria-hidden />
                  {config.operatingHours}
                </p>

                {config.kakaoChannelUrl && (
                  <a
                    href={config.kakaoChannelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'mt-5 inline-flex items-center gap-2 border-t border-border pt-4 text-base text-fg-muted hover:text-primary-deep',
                    )}
                  >
                    <MessageSquare className="size-5 shrink-0" aria-hidden />
                    카카오톡 채널로 문의하기
                  </a>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </SupportPage>
  )
}
