import { createBrowserRouter } from 'react-router-dom'
import { PlaceholderPage } from '@/components/common/placeholder-page'
import { SiteLayout } from '@/components/layout/site-layout'
import { HomePage } from '@/pages/Home'
import { JobListPage } from '@/pages/JobList'

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/jobs', element: <JobListPage /> },
      {
        path: '/jobs/:jobId',
        element: <PlaceholderPage title="공고 상세" description="구인공고 상세 화면을 준비 중입니다." />,
      },
      {
        path: '/talents',
        element: <PlaceholderPage title="인재정보" description="인재정보 목록 화면을 준비 중입니다." />,
      },
      {
        path: '/talents/:talentId',
        element: <PlaceholderPage title="인재 상세" description="인재정보 상세 화면을 준비 중입니다." />,
      },
      {
        path: '/nearby',
        element: <PlaceholderPage title="내 주변 일자리" />,
      },
      {
        path: '/apply',
        element: <PlaceholderPage title="구직신청" description="구직신청서 작성 화면을 준비 중입니다." />,
      },
      {
        path: '/support/*',
        element: <PlaceholderPage title="고객센터" />,
      },
      {
        path: '/support',
        element: <PlaceholderPage title="고객센터" />,
      },
      { path: '/login', element: <PlaceholderPage title="로그인" /> },
      { path: '/signup', element: <PlaceholderPage title="회원가입" /> },
      { path: '/notifications', element: <PlaceholderPage title="알림" /> },
      { path: '/mypage/*', element: <PlaceholderPage title="마이페이지" /> },
      { path: '/mypage', element: <PlaceholderPage title="마이페이지" /> },
      { path: '/about', element: <PlaceholderPage title="회사소개" /> },
      { path: '/terms', element: <PlaceholderPage title="이용약관" /> },
      { path: '/privacy', element: <PlaceholderPage title="개인정보처리방침" /> },
      {
        path: '*',
        element: (
          <PlaceholderPage title="페이지를 찾을 수 없습니다" description="주소를 다시 확인해 주세요." />
        ),
      },
    ],
  },
])
