/**
 * API enum name → 한글 라벨 매핑.
 * 단일 소스: docs/ENUM_MAPPING.md. JSON 은 항상 enum name 을 주고받고,
 * 화면 표시는 이 맵을 거친다.
 */
import type {
  CertificateType,
  EmploymentType,
  FacilityType,
  JobCategory,
  WorkSchedule,
} from '@/types'

/** 직종 (docs/ENUM_MAPPING.md §1) */
export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  CAREGIVER: '요양보호사',
  CARE_ATTENDANT: '간병인',
  NURSE_AIDE: '간호조무사',
  SOCIAL_WORKER: '사회복지사',
  LIFE_SUPPORT: '생활지원사',
  HOUSEKEEPER: '가사도우미',
  ETC: '기타',
}

/** enum name 을 한글 라벨로. 알 수 없는 값은 원문 그대로 돌려준다. */
export function jobCategoryLabel(category: JobCategory | string): string {
  return JOB_CATEGORY_LABELS[category as JobCategory] ?? String(category)
}

/** 근무 시간대 (docs/ENUM_MAPPING.md §2) */
export const WORK_SCHEDULE_LABELS: Record<WorkSchedule, string> = {
  DAY: '주간',
  MORNING: '오전',
  AFTERNOON: '오후',
  NIGHT: '야간',
  SHIFT: '교대',
}

/** enum name 을 한글 라벨로. null/미지정이면 빈 문자열. */
export function workScheduleLabel(schedule: WorkSchedule | string | null | undefined): string {
  if (!schedule) return ''
  return WORK_SCHEDULE_LABELS[schedule as WorkSchedule] ?? String(schedule)
}

/** 고용형태 (docs/ENUM_MAPPING.md §3) */
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  TEMPORARY: '단기',
  PART_TIME: '파트타임',
}

/** enum name 을 한글 라벨로. null/미지정(목록 응답엔 없는 필드)이면 빈 문자열. */
export function employmentTypeLabel(type: EmploymentType | string | null | undefined): string {
  if (!type) return ''
  return EMPLOYMENT_TYPE_LABELS[type as EmploymentType] ?? String(type)
}

/** 시설 유형 (docs/ENUM_MAPPING.md §4) */
export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  VISITING_CARE: '방문요양센터',
  NURSING_HOME: '요양원',
  DAY_NIGHT_CARE: '주야간보호센터',
  COMMUNITY_CARE: '재가복지센터',
  NURSING_HOSPITAL: '요양병원',
  ETC: '기타',
}

/** enum name 을 한글 라벨로. 알 수 없는 값은 원문 그대로 돌려준다. */
export function facilityTypeLabel(type: FacilityType | string): string {
  return FACILITY_TYPE_LABELS[type as FacilityType] ?? String(type)
}

feature/fe-phase-a-integration
/* ---------------------------------------------------------------------------
   구인공고 상세 전용 — 어르신 정보 (ElderlyInfoCard). API 는 flat enum 으로 내려주고
   화면은 한글 문장으로 표시하므로 여기서 변환한다. (docs/API.md §11, JOBPOSTING_FIELDS.md)
   --------------------------------------------------------------------------- */

/** 장기요양등급 — API "GRADE_4" -> 화면 "4등급" */
const CARE_GRADE_LABELS: Record<string, string> = {
  GRADE_1: '1등급',
  GRADE_2: '2등급',
  GRADE_3: '3등급',
  GRADE_4: '4등급',
  GRADE_5: '5등급',
}
export function careGradeLabel(grade: string | null | undefined): string {
  if (!grade) return ''
  return CARE_GRADE_LABELS[grade] ?? grade
}

const ELDER_GENDER_LABELS: Record<string, string> = { MALE: '남', FEMALE: '여' }
export function elderGenderLabel(gender: string | null | undefined): string {
  if (!gender) return '무관'
  return ELDER_GENDER_LABELS[gender] ?? gender
}

const MOBILITY_STATUS_LABELS: Record<string, string> = {
  INDEPENDENT: '보행 가능',
  PARTIAL_ASSIST: '부분 도움 필요',
  BEDRIDDEN: '거동 불가',
}
export function mobilityStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return MOBILITY_STATUS_LABELS[status] ?? status
}

const MEAL_STATUS_LABELS: Record<string, string> = {
  SELF: '자립',
  ASSIST: '도움 필요',
  TUBE: '경관 급식',
}
export function mealStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return MEAL_STATUS_LABELS[status] ?? status
}

const COGNITIVE_STATUS_LABELS: Record<string, string> = {
  NORMAL: '정상',
  MILD: '경증 치매',
  SEVERE: '중증 치매',
}
export function cognitiveStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return COGNITIVE_STATUS_LABELS[status] ?? status
}

/** 급여 유형 — API 는 대문자(HOURLY/DAILY/MONTHLY), 화면·PayType(lib/utils)은 소문자를 쓴다. */
const API_PAY_TYPE_TO_LOCAL: Record<string, 'hourly' | 'daily' | 'monthly'> = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  MONTHLY: 'monthly',
}
export function payTypeFromApi(payType: string): 'hourly' | 'daily' | 'monthly' {
  return API_PAY_TYPE_TO_LOCAL[payType] ?? 'monthly'
}

const LOCAL_PAY_TYPE_TO_API: Record<string, 'HOURLY' | 'DAILY' | 'MONTHLY'> = {
  hourly: 'HOURLY',
  daily: 'DAILY',
  monthly: 'MONTHLY',
}
/** 필터 패널 체크박스 값(hourly 등)을 검색 API 파라미터(HOURLY 등)로 되돌린다. */
export function payTypeToApi(payType: string): 'HOURLY' | 'DAILY' | 'MONTHLY' {
  return LOCAL_PAY_TYPE_TO_API[payType] ?? 'MONTHLY'
=======
/** 자격증 종류 (docs/ENUM_MAPPING.md §5) */
export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  CAREGIVER: '요양보호사',
  NURSE_AIDE: '간호조무사',
  SOCIAL_WORKER_1: '사회복지사 1급',
  SOCIAL_WORKER_2: '사회복지사 2급',
  CARE_ASSISTANT: '간병사',
  DRIVER_LICENSE: '운전면허',
  OTHER: '기타',
}

/**
 * enum name 을 한글 라벨로. 알 수 없는 값(OTHER 의 자유 입력 이름 등)은 원문 그대로 돌려준다.
 */
export function certificateTypeLabel(type: CertificateType | string): string {
  return CERTIFICATE_TYPE_LABELS[type as CertificateType] ?? String(type)
 main
}
