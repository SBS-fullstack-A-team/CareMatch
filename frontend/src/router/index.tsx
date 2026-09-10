import { createBrowserRouter } from 'react-router-dom'
import { PlaceholderPage } from '@/components/common/placeholder-page'
import { SiteLayout } from '@/components/layout/site-layout'
import { HomePage } from '@/pages/Home'
import { JobApplyPage } from '@/pages/JobApply'
import { JobDetailPage } from '@/pages/JobDetail'
import { JobListPage } from '@/pages/JobList'
import { NearbyJobsPage } from '@/pages/NearbyJobs'
import { TalentDetailPage } from '@/pages/TalentDetail'
import { TalentListPage } from '@/pages/TalentList'
import { LoginPage } from '@/pages/Login'
import { OAuthCallbackPage } from '@/pages/OAuthCallback'

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/jobs', element: <JobListPage /> },
      { path: '/jobs/:jobId', element: <JobDetailPage /> },
      { path: '/talents', element: <TalentListPage /> },
      { path: '/talents/:talentId', element: <TalentDetailPage /> },
      { path: '/nearby', element: <NearbyJobsPage /> },
      { path: '/apply', element: <JobApplyPage /> },
      {
        path: '/support/*',
        element: <PlaceholderPage title="고객센터" />,
      },
      {
        path: '/support',
        element: <PlaceholderPage title="고객센터" />,
      },
      { path: '/login', element: <LoginPage /> },
      { path: '/oauth/callback', element: <OAuthCallbackPage /> },
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
