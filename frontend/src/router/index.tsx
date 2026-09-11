import { createBrowserRouter } from 'react-router-dom'
import { PlaceholderPage } from '@/components/common/placeholder-page'
import { SiteLayout } from '@/components/layout/site-layout'
import { TalentAccessGate } from '@/components/talent/talent-access-gate'
import { HomePage } from '@/pages/Home'
import { JobApplyPage } from '@/pages/JobApply'
import { JobDetailPage } from '@/pages/JobDetail'
import { JobListPage } from '@/pages/JobList'
import { LegalPage } from '@/pages/Legal'
import { NearbyJobsPage } from '@/pages/NearbyJobs'
import { TalentDetailPage } from '@/pages/TalentDetail'
import { TalentListPage } from '@/pages/TalentList'
import { LoginPage } from '@/pages/Login'
import { MyPageApplicationsPage } from '@/pages/MyPage/Applications'
import { MyPageCertificatesPage } from '@/pages/MyPage/Certificates'
import { MyPageLayout } from '@/pages/MyPage/MyPageLayout'
import { MyPageOverviewPage } from '@/pages/MyPage/Overview'
import { MyPageScrapsPage } from '@/pages/MyPage/Scraps'
import { MyPageSettingsPage } from '@/pages/MyPage/Settings'
import { OAuthCallbackPage } from '@/pages/OAuthCallback'
import { OAuthSelectRolePage } from '@/pages/OAuthSelectRole'
import { SignupPage } from '@/pages/Signup'
import { SupportHomePage } from '@/pages/Support'
import { SupportFaqPage } from '@/pages/Support/Faq'
import { SupportInquiryDetailPage } from '@/pages/Support/InquiryDetail'
import { SupportInquiryFormPage } from '@/pages/Support/InquiryForm'
import { SupportInquiryListPage } from '@/pages/Support/InquiryList'
import { SupportNoticeDetailPage } from '@/pages/Support/NoticeDetail'
import { SupportNoticeListPage } from '@/pages/Support/NoticeList'

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/jobs', element: <JobListPage /> },
      { path: '/jobs/:jobId', element: <JobDetailPage /> },
      {
        path: '/talents',
        element: (
          <TalentAccessGate>
            <TalentListPage />
          </TalentAccessGate>
        ),
      },
      {
        path: '/talents/:talentId',
        element: (
          <TalentAccessGate>
            <TalentDetailPage />
          </TalentAccessGate>
        ),
      },
      { path: '/nearby', element: <NearbyJobsPage /> },
      { path: '/apply', element: <JobApplyPage /> },
      { path: '/support', element: <SupportHomePage /> },
      { path: '/support/faq', element: <SupportFaqPage /> },
      { path: '/support/notice', element: <SupportNoticeListPage /> },
      { path: '/support/notice/:noticeId', element: <SupportNoticeDetailPage /> },
      { path: '/support/inquiry', element: <SupportInquiryFormPage /> },
      { path: '/support/inquiries', element: <SupportInquiryListPage /> },
      { path: '/support/inquiries/:inquiryId', element: <SupportInquiryDetailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/oauth/callback', element: <OAuthCallbackPage /> },
      { path: '/oauth/select-role', element: <OAuthSelectRolePage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/notifications', element: <PlaceholderPage title="알림" /> },
      {
        path: '/mypage',
        element: <MyPageLayout />,
        children: [
          { index: true, element: <MyPageOverviewPage /> },
          { path: 'applications', element: <MyPageApplicationsPage /> },
          { path: 'scraps', element: <MyPageScrapsPage /> },
          { path: 'certificates', element: <MyPageCertificatesPage /> },
          { path: 'settings', element: <MyPageSettingsPage /> },
          // 등록한 공고(시설)/포인트/알림설정 등 아직 없는 하위 화면
          { path: '*', element: <PlaceholderPage title="마이페이지" /> },
        ],
      },
      { path: '/about', element: <PlaceholderPage title="회사소개" /> },
      { path: '/terms', element: <LegalPage type="SERVICE" /> },
      { path: '/privacy', element: <LegalPage type="PRIVACY" /> },
      {
        path: '*',
        element: (
          <PlaceholderPage title="페이지를 찾을 수 없습니다" description="주소를 다시 확인해 주세요." />
        ),
      },
    ],
  },
])
