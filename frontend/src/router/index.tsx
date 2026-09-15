import { createBrowserRouter } from 'react-router-dom'
import { PlaceholderPage } from '@/components/common/placeholder-page'
import { SiteLayout } from '@/components/layout/site-layout'
import { TalentAccessGate } from '@/components/talent/talent-access-gate'
import { AboutPage } from '@/pages/About'
import { HomePage } from '@/pages/Home'
import { JobApplyPage } from '@/pages/JobApply'
import { JobDetailPage } from '@/pages/JobDetail'
import { JobListPage } from '@/pages/JobList'
import { LegalPage } from '@/pages/Legal'
import { NearbyJobsPage } from '@/pages/NearbyJobs'
import { NotificationsPage } from '@/pages/Notifications'
import { TalentDetailPage } from '@/pages/TalentDetail'
import { TalentListPage } from '@/pages/TalentList'
import { LoginPage } from '@/pages/Login'
import { AdminFacilitiesPage } from '@/pages/MyPage/admin/AdminFacilities'
import { AdminInquiriesPage } from '@/pages/MyPage/admin/AdminInquiries'
import { AdminInquiryDetailPage } from '@/pages/MyPage/admin/AdminInquiryDetail'
import { AdminMembersPage } from '@/pages/MyPage/admin/AdminMembers'
import { AdminNoticeFormPage } from '@/pages/MyPage/admin/AdminNoticeForm'
import { AdminNoticesPage } from '@/pages/MyPage/admin/AdminNotices'
import { AdminPointChargesPage } from '@/pages/MyPage/admin/AdminPointCharges'
import { AdminRoute } from '@/pages/MyPage/admin/shared'
import { MyPageApplicationsPage } from '@/pages/MyPage/Applications'
import { MyPageCertificatesPage } from '@/pages/MyPage/Certificates'
import { MyPageJobApplicantsPage } from '@/pages/MyPage/JobApplicants'
import { MyPageJobsPage } from '@/pages/MyPage/Jobs'
import { JobPostingFormPage } from '@/pages/MyPage/JobPostingForm'
import { MyPageLayout } from '@/pages/MyPage/MyPageLayout'
import { MyPageOverviewPage } from '@/pages/MyPage/Overview'
import { MyPageScrapsPage } from '@/pages/MyPage/Scraps'
import { MyPageSettingsPage } from '@/pages/MyPage/Settings'
import { OAuthCallbackPage } from '@/pages/OAuthCallback'
import { OAuthSelectRolePage } from '@/pages/OAuthSelectRole'
import { PasswordResetPage } from '@/pages/PasswordReset'
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
      { path: '/password-reset', element: <PasswordResetPage /> },
      { path: '/oauth/callback', element: <OAuthCallbackPage /> },
      { path: '/oauth/select-role', element: <OAuthSelectRolePage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      {
        path: '/mypage',
        element: <MyPageLayout />,
        children: [
          { index: true, element: <MyPageOverviewPage /> },
          { path: 'applications', element: <MyPageApplicationsPage /> },
          { path: 'scraps', element: <MyPageScrapsPage /> },
          { path: 'certificates', element: <MyPageCertificatesPage /> },
          { path: 'jobs', element: <MyPageJobsPage /> },
          { path: 'jobs/new', element: <JobPostingFormPage /> },
          { path: 'jobs/:jobPostingId/edit', element: <JobPostingFormPage /> },
          { path: 'jobs/:jobPostingId/applicants', element: <MyPageJobApplicantsPage /> },
          { path: 'settings', element: <MyPageSettingsPage /> },
          {
            path: 'admin/members',
            element: (
              <AdminRoute>
                <AdminMembersPage />
              </AdminRoute>
            ),
          },
          {
            path: 'admin/point-charges',
            element: (
              <AdminRoute>
                <AdminPointChargesPage />
              </AdminRoute>
            ),
          },
          {
            path: 'admin/facilities',
            element: (
              <AdminRoute>
                <AdminFacilitiesPage />
              </AdminRoute>
            ),
          },
          {
            path: 'admin/inquiries',
            element: (
              <AdminRoute>
                <AdminInquiriesPage />
              </AdminRoute>
            ),
          },
          {
            path: 'admin/inquiries/:inquiryId',
            element: (
              <AdminRoute>
                <AdminInquiryDetailPage />
              </AdminRoute>
            ),
          },
          {
            path: 'admin/notices',
            element: (
              <AdminRoute>
                <AdminNoticesPage />
              </AdminRoute>
            ),
          },
          {
            path: 'admin/notices/new',
            element: (
              <AdminRoute>
                <AdminNoticeFormPage />
              </AdminRoute>
            ),
          },
          {
            path: 'admin/notices/:noticeId/edit',
            element: (
              <AdminRoute>
                <AdminNoticeFormPage />
              </AdminRoute>
            ),
          },
          // 포인트/알림설정 등 아직 없는 하위 화면
          { path: '*', element: <PlaceholderPage title="마이페이지" /> },
        ],
      },
      { path: '/about', element: <AboutPage /> },
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
