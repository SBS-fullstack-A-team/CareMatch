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
   인재 화면 전체의 타입은 아직 없다(mock 사용, Phase C).
   여기 있는 JobPostingSummary 는 마이페이지가 직접 쓰는 응답 필드만 옮긴 것이라
   아래 JobPostingSummaryResponse(구인공고 화면 전체가 쓰는 완전판)의 부분집합이다.
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

/* ---------------------------------------------------------------------------
   구인공고 (docs/API.md, JobPostingDtos) — Phase B.
   `lib/job-adapter.ts` 의 toJob() 이 이 응답을 화면용 types/index.ts 의 Job 으로 변환한다.
   enum 필드는 항상 대문자 enum name (JSON 그대로), 한글 라벨은 data/labels.ts 를 거친다.
   --------------------------------------------------------------------------- */

export type ApiJobType =
  | 'CAREGIVER'
  | 'CARE_ATTENDANT'
  | 'NURSE_AIDE'
  | 'SOCIAL_WORKER'
  | 'LIFE_SUPPORT'
  | 'HOUSEKEEPER'
  | 'ETC'
export type ApiWorkType = 'COMMUTE' | 'LIVE_IN' | 'REMOTE' | 'NEGOTIABLE'
export type ApiWorkSchedule = 'DAY' | 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'SHIFT'
export type ApiEmploymentType = 'FULL_TIME' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME'
export type ApiPayType = 'HOURLY' | 'DAILY' | 'MONTHLY'
export type ApiFacilityType =
  | 'VISITING_CARE'
  | 'NURSING_HOME'
  | 'DAY_NIGHT_CARE'
  | 'COMMUNITY_CARE'
  | 'NURSING_HOSPITAL'
  | 'ETC'
export type ApiCareGrade = 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'GRADE_4' | 'GRADE_5'
export type ApiElderGender = 'MALE' | 'FEMALE'
export type ApiMobilityStatus = 'INDEPENDENT' | 'PARTIAL_ASSIST' | 'BEDRIDDEN'
export type ApiMealStatus = 'SELF' | 'ASSIST' | 'TUBE'
export type ApiCognitiveStatus = 'NORMAL' | 'MILD' | 'SEVERE'
export type JobPostingStatus = 'OPEN' | 'CLOSED'
export type ExposureType = 'NORMAL' | 'PREMIUM' | 'SPECIAL'
/** RECOMMENDED(기본) / LATEST / DEADLINE / PAY_DESC / PAY_ASC / VIEWS */
export type JobPostingSort = 'RECOMMENDED' | 'LATEST' | 'DEADLINE' | 'PAY_DESC' | 'PAY_ASC' | 'VIEWS'

/** 매칭 사유 한 건 (상세 응답 전용). kind: category/region/schedule/pay */
export interface MatchReason {
  kind: string
  label: string
  matched: boolean
  detail: string | null
}

/** GET /api/job-postings, /featured, /{id}/similar 목록 카드용 경량 응답 */
export interface JobPostingSummaryResponse {
  id: number
  title: string
  jobType: ApiJobType
  thumbnailUrl: string | null
  catchphrase: string | null
  minCareerYears: number | null
  sido: string
  sigungu: string
  workSchedule: ApiWorkSchedule | null
  workDays: string
  workStartTime: string
  workEndTime: string
  payType: ApiPayType
  payAmount: number
  careGrade: ApiCareGrade
  elderGender: ApiElderGender
  mobilityStatus: ApiMobilityStatus
  duties: string[]
  deadline: string | null
  dDay: number | null
  viewCount: number
  applicantCount: number
  status: JobPostingStatus
  exposureType: ExposureType
  isNew: boolean
  isClosingSoon: boolean
  isRecommended: boolean
  facilityName: string
  facilityType: ApiFacilityType | null
  matchingScore: number | null
  /** 로그인 회원의 찜 여부. 비로그인이면 null. */
  scrapped: boolean | null
  createdAt: string
}

/** GET /api/job-postings/{id} */
export interface JobPostingDetailResponse {
  id: number
  title: string
  jobType: ApiJobType
  description: string | null
  thumbnailUrl: string | null
  catchphrase: string | null
  requirements: string[]
  preferences: string[]
  benefits: string[]
  minCareerYears: number | null
  workType: ApiWorkType
  workSchedule: ApiWorkSchedule | null
  employmentType: ApiEmploymentType
  employmentTypeNote: string | null
  workDays: string
  workStartTime: string
  workEndTime: string
  payType: ApiPayType
  payAmount: number
  recruitCount: number
  deadline: string | null
  dDay: number | null
  sido: string
  sigungu: string
  addressDetail: string | null
  latitude: number | null
  longitude: number | null
  careGrade: ApiCareGrade
  elderGender: ApiElderGender
  elderAgeRange: string | null
  mobilityStatus: ApiMobilityStatus
  mealStatus: ApiMealStatus
  cognitiveStatus: ApiCognitiveStatus
  elderNote: string | null
  duties: string[]
  requiredDocuments: string[]
  status: JobPostingStatus
  exposureType: ExposureType
  isNew: boolean
  isClosingSoon: boolean
  isRecommended: boolean
  viewCount: number
  applicantCount: number
  createdAt: string
  updatedAt: string
  facilityMemberId: number
  facilityName: string
  facilityType: ApiFacilityType | null
  facilityPhone: string | null
  managerName: string
  matchingScore: number | null
  matchingReasons: MatchReason[]
  scrapped: boolean | null
}

/** GET /api/job-postings 등에 보내는 검색 파라미터 (모두 선택) */
export interface JobPostingSearchParams {
  /** 시·도 다중(OR). 좌측 필터 "지역" 체크박스가 여러 개 선택될 수 있다. */
  sidos?: string[]
  sigungu?: string
  jobTypes?: ApiJobType[]
  facilityTypes?: ApiFacilityType[]
  workTypes?: ApiWorkType[]
  workSchedules?: ApiWorkSchedule[]
  employmentTypes?: ApiEmploymentType[]
  payTypes?: ApiPayType[]
  payMin?: number
  payMax?: number
  sort?: JobPostingSort
  /** 제목·시설명 부분일치 자유 텍스트 검색 */
  keyword?: string
  page?: number
  size?: number
}

/** GET /api/job-postings/facets — 좌측 필터 옵션별 결과 건수 (축 자신의 선택은 제외하고 센다) */
export interface JobFacetsResponse {
  sido: Record<string, number>
  jobType: Record<string, number>
  facilityType: Record<string, number>
  workSchedule: Record<string, number>
  payType: Record<string, number>
}

/* ---------------------------------------------------------------------------
   인재(구직자) — docs/API.md, TalentSearchDtos / JobSeekerProfileResponse. Phase C.
   `lib/talent-adapter.ts` 의 toTalent() 가 이 응답을 화면용 types/index.ts 의 Talent 로 변환한다.
   --------------------------------------------------------------------------- */

export type ApiGender = 'MALE' | 'FEMALE'
export type ApiEducationLevel = 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'GRADUATE'
export type ApiCareTask =
  | 'DAILY_LIFE_SUPPORT'
  | 'MEAL_SUPPORT'
  | 'BATH_SUPPORT'
  | 'MOBILITY_SUPPORT'
  | 'COGNITIVE_ACTIVITY'
  | 'PERSONAL_HYGIENE'
  | 'HOUSEWORK'
  | 'HOSPITAL_ESCORT'
export type ApiEmploymentStatus = 'SEEKING' | 'EMPLOYED'
/** 경력 구간. ENTRY=신입, Y1_3=1~3년, Y3_5=3~5년, Y5_PLUS=5년 이상. */
export type CareerBucket = 'ENTRY' | 'Y1_3' | 'Y3_5' | 'Y5_PLUS'

/** 희망지역 한 건. sigungu 가 null 이면 "그 시·도 전체". */
export interface RegionDto {
  sido: string
  sigungu: string | null
}

/** GET /api/jobseekers 목록 카드 (TalentSearchDtos.TalentSummary) */
export interface TalentSummaryResponse {
  profileId: number
  memberId: number
  /** 마스킹된 이름("홍*동"). */
  name: string
  employmentStatus: ApiEmploymentStatus
  gender: ApiGender | null
  age: number | null
  photoUrl: string | null
  careerYears: number | null
  education: ApiEducationLevel | null
  desiredJobType: ApiJobType | null
  desiredWorkType: ApiWorkType | null
  desiredWorkSchedule: ApiWorkSchedule | null
  desiredRegions: RegionDto[]
  desiredPayType: ApiPayType | null
  desiredMinPay: number | null
  desiredWorkDays: string | null
  desiredWorkStartTime: string | null
  desiredWorkEndTime: string | null
  /** 표시용 자격증 이름. */
  certificateNames: string[]
  /** certificateNames 와 같은 순서 대응하는 enum name. */
  certificateTypes: string[]
  updatedAt: string
  /** 이 시설의 OPEN 공고들 중 최고 매칭 점수. 시설이 아니거나 희망조건 미설정이면 null. */
  matchingScore: number | null
}

/** 상세 응답의 자격증 한 건 (member/dto/CertificateResponse) */
export interface JobSeekerCertificate {
  id: number
  certificateType: string
  certificateName: string
  certificateNumber: string | null
  status: CertificateStatus
  downloadUrl: string | null
}

export interface PostingMatchResponse {
  jobPostingId: number
  title: string
  jobType: ApiJobType
  matchingScore: number
}

/** GET /api/jobseekers/{id}(시설 열람) 및 GET /api/jobseekers/me(본인) 공용 응답 */
export interface JobSeekerProfileResponseDto {
  profileId: number
  memberId: number
  name: string
  employmentStatus: ApiEmploymentStatus
  /** 마스킹된 연락처. contactUnlocked=true(또는 /me)면 언마스크. */
  phone: string
  residence: string
  introduction: string | null
  contactUnlocked: boolean
  unlockCost: number
  certificates: JobSeekerCertificate[]
  gender: ApiGender | null
  age: number | null
  photoUrl: string | null
  careerYears: number | null
  education: ApiEducationLevel | null
  headline: string | null
  availableTasks: ApiCareTask[]
  desiredJobType: ApiJobType | null
  desiredWorkType: ApiWorkType | null
  desiredWorkSchedule: ApiWorkSchedule | null
  desiredRegions: RegionDto[]
  desiredPayType: ApiPayType | null
  desiredMinPay: number | null
  desiredEmploymentTypes: ApiEmploymentType[]
  desiredWorkDays: string | null
  desiredWorkStartTime: string | null
  desiredWorkEndTime: string | null
  /** 시설회원이 볼 때만: 그 시설의 OPEN 공고 중 최고 매칭 점수. 본인(/me)이면 null. */
  matchingScore: number | null
  /** 시설회원이 볼 때만: 그 시설의 OPEN 공고별 매칭 결과. 본인(/me)이면 빈 배열. */
  postingMatches: PostingMatchResponse[]
}

/** PUT /api/jobseekers/me 요청 (JobSeekerProfileUpdateRequest) */
export interface JobSeekerProfileUpdateRequestDto {
  employmentStatus: ApiEmploymentStatus
  residence?: string
  introduction?: string
  gender?: ApiGender
  birthYear?: number
  photoUrl?: string
  careerYears?: number
  education?: ApiEducationLevel
  headline?: string
  availableTasks?: ApiCareTask[]
  desiredJobType?: ApiJobType
  desiredWorkType?: ApiWorkType
  desiredWorkSchedule?: ApiWorkSchedule
  /** 최대 3. */
  desiredRegions?: RegionDto[]
  desiredPayType?: ApiPayType
  desiredMinPay?: number
  desiredEmploymentTypes?: ApiEmploymentType[]
  desiredWorkDays?: string
  desiredWorkStartTime?: string
  desiredWorkEndTime?: string
}

/** POST /api/jobseekers/{id}/contact/unlock 응답 */
export interface ContactUnlockResponseDto {
  profileId: number
  phone: string
  residence: string
  free: boolean
  pointsSpent: number
  unlockedAt: string
}

/** GET /api/jobseekers 등에 보내는 검색 파라미터 (모두 선택) */
export interface TalentSearchParams {
  /** 희망 직종 다중(OR). 좌측 필터 체크박스가 여러 직종을 동시에 선택할 수 있다. */
  desiredJobTypes?: ApiJobType[]
  desiredWorkType?: ApiWorkType
  desiredWorkSchedules?: ApiWorkSchedule[]
  sidos?: string[]
  sigungu?: string
  payTypes?: ApiPayType[]
  payMax?: number
  gender?: ApiGender
  careerBuckets?: CareerBucket[]
  availableTasks?: ApiCareTask[]
  desiredEmploymentTypes?: ApiEmploymentType[]
  certificateTypes?: string[]
  seekingOnly?: boolean
  updatedWithinDays?: number
  /** LATEST(기본) / CAREER_DESC / CAREER_ASC */
  sort?: 'LATEST' | 'CAREER_DESC' | 'CAREER_ASC'
  page?: number
  size?: number
}

/** GET /api/jobseekers/facets — 좌측 필터 옵션별 결과 인원수. 자격증 축은 제공하지 않는다. */
export interface TalentFacetsResponse {
  sido: Record<string, number>
  desiredJobType: Record<string, number>
  desiredWorkSchedule: Record<string, number>
  careerBucket: Record<string, number>
}
