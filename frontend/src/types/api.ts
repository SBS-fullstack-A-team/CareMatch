/**
 * 백엔드(Spring) API 요청/응답 타입.
 * 출처: docs/API.md, backend/src/main/java/com/carematch/**\/dto
 *
 * 여기엔 인증·회원(세션 토대에 필요한 것)만 둔다.
 * 공고/인재/고객센터 등 화면별 타입은 각 기능 담당이 이 파일에 이어서 추가.
 */

/** 공통 에러 응답 바디 (GlobalExceptionHandler / ErrorResponse) */
export interface ApiErrorBody {
  code: string
  message: string
  timestamp?: string
  path?: string
  fieldErrors?: { field: string; reason: string }[]
}

export type MemberRole = 'JOBSEEKER' | 'FACILITY' | 'ADMIN' | 'GUEST'

/** POST /api/auth/login, POST /api/auth/reissue, POST /api/auth/social/select-role */
export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  /** access 토큰 만료까지 남은 초 */
  accessTokenExpiresIn: number
  /** 회원 유형(구직자/시설) 선택 완료 여부. false 면 유형 선택 화면으로 */
  roleSelected: boolean
}

/** GET /api/members/me — 마이페이지 상단 요약 (MyPageResponse) */
export interface MyPageResponse {
  memberId: number
  name: string
  email: string
  role: MemberRole
  membershipType: string
  point: number
  employmentStatus: 'SEEKING' | 'EMPLOYED' | null
  facilityApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
}

export type FontScaleServer = 'NORMAL' | 'LARGE' | 'XLARGE'

/** GET/PUT /api/members/me/display-preference (DisplayPreferenceDtos) */
export interface DisplayPreference {
  easyMode: boolean
  fontScale: FontScaleServer
}

/** POST /api/auth/social/select-role 요청 (SocialRoleSelectionRequest) */
export interface SocialRoleSelectionRequest {
  role: 'JOBSEEKER' | 'FACILITY'
  residence?: string
  facilityName?: string
  businessRegistrationNumber?: string
  businessLicenseFileKey?: string
}

/* ---------------------------------------------------------------------------
   회원가입 (docs/API.md §1, §2, §5)
   --------------------------------------------------------------------------- */

/** GET /api/members/exists — 쿼리로 보낸 항목의 키만 채워져서 온다 */
export interface ExistsResponse {
  loginIdAvailable?: boolean
  emailAvailable?: boolean
}

export type TermsTypeName = 'SERVICE' | 'PRIVACY' | 'MARKETING'

/** GET /api/terms (목록은 content=null) / GET /api/terms/{type} (content 포함) */
export interface TermsResponse {
  id: number
  type: TermsTypeName
  version: string
  title: string
  /**
   * 서버 DB 컬럼값. 현재 시드 데이터가 SERVICE/PRIVACY 도 false 라 신뢰할 수 없다.
   * 실제 강제 여부는 백엔드 TermsType enum(SERVICE·PRIVACY = required)이 결정한다.
   */
  required: boolean
  content: string | null
}

/** 회원가입 시 약관 동의 1건 (TermsAgreementRequest) */
export interface TermsAgreementRequest {
  type: TermsTypeName
  /** GET /api/terms 로 받은 active 버전 그대로. 다르면 TERMS_REAGREEMENT_REQUIRED */
  version: string
  agreed: boolean
}

export type VerificationChannel = 'EMAIL' | 'PHONE'

/** POST /api/verifications/send */
export interface SendCodeRequest {
  channel: VerificationChannel
  target: string
}
export interface SendCodeResponse {
  channel: string
  target: string
  expiresAt: string
  /** local 프로필에서만 채워진다. 배포 환경에서는 null. */
  devCodeHint: string | null
}

/** POST /api/verifications/verify */
export interface VerifyCodeRequest {
  channel: VerificationChannel
  target: string
  code: string
}
export interface VerifyCodeResponse {
  verified: boolean
}

/** POST /api/members/jobseekers (JobSeekerSignupRequest) */
export interface JobSeekerSignupRequest {
  loginId: string
  password: string
  email: string
  name: string
  phone: string
  /** 선택. 최대 200자 */
  residence?: string
  verificationChannel: VerificationChannel
  verificationTarget: string
  agreements: TermsAgreementRequest[]
}

/** 회원가입 결과 (SignupResponse). 토큰은 주지 않는다 — 가입 후 별도 로그인 필요. */
export interface SignupResponse {
  memberId: number
  role: MemberRole
  status: string
  /** 시설회원이면 PENDING, 구직자면 null */
  approvalStatus: string | null
  message: string
}

/* ---------------------------------------------------------------------------
   고객센터 (docs/API.md §8) — SupportDtos.java 기준
   --------------------------------------------------------------------------- */

/**
 * Spring Data 의 Page 응답. 고객센터 API 는 구인공고/인재의 PageResponse 와 달리
 * Spring 기본 Page 형태로 내려오고 number 가 0-base 다.
 */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  /** 0-base 현재 페이지 */
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

/** GET /api/support/notices — NoticeSummary */
export interface NoticeSummary {
  id: number
  title: string
  pinned: boolean
  viewCount: number
  /** LocalDateTime ex) "2026-09-09T02:25:47.632899" */
  createdAt: string
}

/** GET /api/support/notices/{id} — NoticeDetail. 호출 시 서버에서 조회수 +1 */
export interface NoticeDetail extends NoticeSummary {
  content: string
  updatedAt: string
}

/** GET /api/support/faqs — FaqResponse */
export interface FaqResponse {
  id: number
  category: string
  question: string
  answer: string
  sortOrder: number
}

/** GET /api/support/site-config — SiteConfigResponse (이메일 필드는 서버에 없다) */
export interface SiteConfigResponse {
  tel: string
  kakaoChannelUrl: string
  operatingHours: string
}

/** POST /api/support/inquiries — InquiryCreateRequest */
export interface InquiryCreateRequest {
  /** 최대 200자 */
  title: string
  content: string
  /** 파일 업로드 인프라가 없어 프론트에서는 항상 null 로 보낸다 */
  attachmentFileKey?: string | null
}

export type InquiryStatus = 'PENDING' | 'ANSWERED'

/** InquiryReplyResponse */
export interface InquiryReplyResponse {
  id: number
  answeredBy: number | null
  content: string
  createdAt: string
}

/**
 * InquiryResponse. 목록(summary)에서는 content / attachmentFileKey 가 null,
 * replies 가 빈 배열로 내려온다.
 */
export interface InquiryResponse {
  id: number
  memberId: number
  title: string
  content: string | null
  status: InquiryStatus
  attachmentFileKey: string | null
  createdAt: string
  replies: InquiryReplyResponse[]
}

/* ---------------------------------------------------------------------------
   마이페이지 — 지원 / 스크랩 / 자격증
   구인공고·인재 화면 전체의 타입은 아직 없다(mock 사용, Phase B/C).
   여기 있는 타입은 마이페이지가 직접 쓰는 응답 필드만 옮긴 것이라 SummaryResponse 의 부분집합이다.
   --------------------------------------------------------------------------- */

/**
 * 구인공고/인재 목록 계열 API 의 페이지 응답. 0-base.
 * 고객센터의 {@link SpringPage} 와는 다른 커스텀 포맷 (docs/API.md).
 */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type ApplicationStatus = 'APPLIED' | 'ACCEPTED' | 'REJECTED' | 'CANCELED'

/** GET /api/members/me/applications 목록 항목 (ApplicationDtos.MyApplicationResponse) */
export interface MyApplicationResponse {
  applicationId: number
  status: ApplicationStatus
  appliedAt: string
  processedAt: string | null
  message: string | null
  jobPostingId: number
  title: string
  facilityName: string
  sido: string
  sigungu: string
  deadline: string | null
  dDay: number | null
  postingStatus: 'OPEN' | 'CLOSED'
}

/**
 * GET /api/members/me/scraps 목록 항목.
 * 백엔드 SummaryResponse 전체가 아니라 마이페이지가 쓰는 필드만 옮겼다.
 */
export interface JobPostingSummary {
  id: number
  title: string
  facilityName: string
  facilityType: string | null
  sido: string
  sigungu: string
  payType: 'HOURLY' | 'DAILY' | 'MONTHLY'
  payAmount: number | null
  deadline: string | null
  dDay: number | null
  status: 'OPEN' | 'CLOSED'
}

export type CertificateStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

/** GET /api/certificates/me 항목 (CertificateDtos.CertificateDetailResponse) */
export interface CertificateDetailResponse {
  id: number
  certificateName: string
  certificateNumber: string | null
  status: CertificateStatus
  fileSize: number | null
  contentType: string | null
  downloadUrl: string | null
  rejectReason: string | null
}
