import { Link } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { buttonVariants } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { FONT_SCALE_LABEL, FONT_SCALES, useApp } from '@/hooks/use-app'
import { cn } from '@/lib/utils'

/** `/mypage/settings` — 화면 표시 설정(이미 서버 동기화됨) + 계정 정보 요약. */
export function MyPageSettingsPage() {
  const { user, fontScale, setFontScale, easyMode, setEasyMode } = useApp()
  if (!user) return null

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-fg">설정</h1>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-fg">계정 정보</h2>
        <dl className="mt-3 space-y-2 text-base">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">이름</dt>
            <dd className="text-fg">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">회원 유형</dt>
            <dd className="text-fg">{user.memberType === 'facility' ? '시설회원' : '개인회원'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">상태</dt>
            <dd className="text-fg">{user.subtitle}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-fg">화면 표시 설정</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1.5 text-base font-semibold text-fg">글자 크기</p>
            <SegmentedControl
              items={FONT_SCALES.map((scale) => ({ value: scale, label: FONT_SCALE_LABEL[scale] }))}
              value={fontScale}
              onChange={setFontScale}
            />
          </div>
          <Checkbox
            label="쉬운 화면 모드"
            checked={easyMode}
            onChange={(event) => setEasyMode(event.target.checked)}
          />
        </div>
      </section>

      {user.role === 'JOBSEEKER' && (
        <section className="rounded-card border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-fg">희망 근무조건</h2>
          <p className="mt-2 text-base text-fg-muted">
            구직 프로필(희망 직종·지역·근무조건)은 구직신청 화면에서 관리합니다.
          </p>
          <Link to="/apply" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-4 inline-flex')}>
            구직신청 화면으로
          </Link>
        </section>
      )}
    </div>
  )
}
