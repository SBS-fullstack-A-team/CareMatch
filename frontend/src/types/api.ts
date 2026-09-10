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
