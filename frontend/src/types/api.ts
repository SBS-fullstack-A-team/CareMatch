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
