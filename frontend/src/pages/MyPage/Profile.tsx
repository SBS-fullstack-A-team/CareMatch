import { EmptyState } from '@/components/common/empty-state'
import { useApp } from '@/hooks/use-app'
import { JobApplyForm } from '@/pages/JobApply'

/**
 * `/mypage/profile` — 구직자 프로필 수정.
 *
 * 구직신청(`/apply`)과 편집 대상이 `PUT /api/jobseekers/me` 로 같아서 폼을 그대로 재사용하고,
 * 마이페이지 레이아웃 안에 들어가도록 껍데기(브레드크럼·큰 제목·완료 모달)만 뺀다(chrome="mypage").
 * 로그인 확인은 MyPageLayout 이 이미 했으므로 여기서는 역할만 본다.
 */
export function MyPageProfilePage() {
  const { user } = useApp()

  if (!user || user.role !== 'JOBSEEKER') {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          title="구직자 전용 화면입니다."
          description="구직 프로필은 구직회원만 등록·수정할 수 있습니다."
        />
      </div>
    )
  }

  return <JobApplyForm userName={user.name} chrome="mypage" />
}
