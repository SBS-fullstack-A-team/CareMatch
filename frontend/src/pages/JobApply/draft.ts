import { payTypeFromApi, payTypeToApi } from '@/data/labels'
import type { PayType } from '@/lib/utils'
import type { ApiGender, JobSeekerProfileResponseDto, JobSeekerProfileUpdateRequestDto } from '@/types/api'

/**
 * 구직신청 폼 값.
 *
 * 필드 이름은 Talent 타입에 맞추되, 희망 지역만 백엔드(`PUT /api/jobseekers/me`)의
 * desiredSido / desiredSigungu 와 이어지도록 시·도 + 구·군 단일 값으로 둔다.
 * (Talent.regions 는 배열이지만 이 폼은 한 곳만 받는다)
 *
 * 입력 중에는 숫자도 문자열로 들고 있다가 제출 시점에 변환한다.
 */
export interface JobApplyDraft {
  /** Talent.gender */
  gender: '' | '여' | '남'
  /** Talent.age */
  age: string
  /** Talent.category — 희망 직종 */
  category: string
  /** 백엔드 desiredSido */
  sido: string
  /** 백엔드 desiredSigungu */
  district: string
  /** Talent.workSchedule (WorkSchedule enum name) */
  workSchedule: string
  /** Talent.preferredHours */
  preferredHours: string
  /** Talent.payType */
  payType: '' | PayType
  /** Talent.payAmount (원 단위) */
  payAmount: string
  /** Talent.careerYears 입력 보조 — 신입이면 경력 연수를 받지 않는다 */
  hasCareer: '' | 'yes' | 'no'
  careerYears: string
  /** Talent.certificates — CertificateType enum name 배열 (docs/ENUM_MAPPING.md §5) */
  certificates: string[]
  /** Talent.summary */
  summary: string
  /** Talent.availableNow */
  availableNow: boolean
}

export const EMPTY_DRAFT: JobApplyDraft = {
  gender: '',
  age: '',
  category: '',
  sido: '',
  district: '',
  workSchedule: '',
  preferredHours: '',
  payType: '',
  payAmount: '',
  hasCareer: '',
  careerYears: '',
  certificates: [],
  summary: '',
  availableNow: false,
}

/** localStorage 키 — use-app 의 `carematch.fontScale` / `carematch.easyMode` 규칙을 따른다 */
export const DRAFT_KEY = 'carematch.jobApply.draft'

/** 임시저장 불러오기. 값이 깨져 있으면 무시하고 빈 폼으로 시작한다. */
export function loadDraft(): JobApplyDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<JobApplyDraft>
    return {
      ...EMPTY_DRAFT,
      ...parsed,
      // 배열 필드가 다른 타입으로 저장돼 있으면 되돌린다
      certificates: Array.isArray(parsed.certificates) ? parsed.certificates : [],
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: JobApplyDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // 저장소를 못 쓰는 환경이면 무시한다
  }
}

/** 필수 항목 — 이 셋이 없으면 인재정보 검색·필터에서 아예 걸리지 않는다 */
export type RequiredField = 'category' | 'sido' | 'workSchedule'

export function validateDraft(draft: JobApplyDraft) {
  const errors: Partial<Record<RequiredField, string>> = {}
  if (!draft.category) errors.category = '희망 직종을 선택해 주세요.'
  if (!draft.sido) errors.sido = '희망 지역을 선택해 주세요.'
  if (!draft.workSchedule) errors.workSchedule = '근무 시간대를 선택해 주세요.'
  return errors
}

const GENDER_TO_API: Record<'여' | '남', ApiGender> = { 여: 'FEMALE', 남: 'MALE' }
const GENDER_FROM_API: Record<ApiGender, '여' | '남'> = { FEMALE: '여', MALE: '남' }

/**
 * 폼 값을 `PUT /api/jobseekers/me` 요청으로 바꾼다.
 * 이 화면은 "구직 프로필 작성"이라 employmentStatus 는 항상 SEEKING 으로 저장한다
 * (재직 중으로 바꾸는 화면은 없다 — 필요하면 마이페이지에 별도로 추가).
 * 자격증(certificates)은 여기서 저장되지 않는다 — 별도 API(POST /api/certificates, 파일 업로드
 * 필요)라 이 폼의 체크박스는 미리보기 용도로만 쓰인다.
 */
export function toUpdateRequest(draft: JobApplyDraft): JobSeekerProfileUpdateRequestDto {
  return {
    employmentStatus: 'SEEKING',
    gender: draft.gender ? GENDER_TO_API[draft.gender] : undefined,
    birthYear: draft.age ? new Date().getFullYear() - Number(draft.age) : undefined,
    careerYears: draft.hasCareer === 'no' ? 0 : draft.hasCareer === 'yes' && draft.careerYears
      ? Number(draft.careerYears)
      : undefined,
    desiredJobType: (draft.category || undefined) as JobSeekerProfileUpdateRequestDto['desiredJobType'],
    desiredWorkSchedule: (draft.workSchedule || undefined) as JobSeekerProfileUpdateRequestDto['desiredWorkSchedule'],
    desiredRegions: draft.sido ? [{ sido: draft.sido, sigungu: draft.district || null }] : undefined,
    desiredPayType: draft.payType ? payTypeToApi(draft.payType) : undefined,
    desiredMinPay: draft.payAmount ? Number(draft.payAmount) : undefined,
    introduction: draft.summary || undefined,
  }
}

/**
 * 서버에 저장된 내 프로필을 폼 값으로 되돌린다 (재방문 시 이어서 작성).
 * availableNow 는 백엔드에 대응 필드가 없어 항상 false 로 시작한다.
 * 희망지역은 최대 3개까지 저장되지만 이 폼은 하나만 받으므로 첫 번째 것만 보여준다.
 */
export function fromProfile(profile: JobSeekerProfileResponseDto): JobApplyDraft {
  const region = profile.desiredRegions[0]
  return {
    gender: profile.gender ? GENDER_FROM_API[profile.gender] : '',
    age: profile.age != null ? String(profile.age) : '',
    category: profile.desiredJobType ?? '',
    sido: region?.sido ?? '',
    district: region?.sigungu ?? '',
    workSchedule: profile.desiredWorkSchedule ?? '',
    preferredHours:
      profile.desiredWorkDays && profile.desiredWorkStartTime && profile.desiredWorkEndTime
        ? `${profile.desiredWorkDays} (${profile.desiredWorkStartTime.slice(0, 5)} ~ ${profile.desiredWorkEndTime.slice(0, 5)})`
        : '',
    payType: profile.desiredPayType ? payTypeFromApi(profile.desiredPayType) : '',
    payAmount: profile.desiredMinPay != null ? String(profile.desiredMinPay) : '',
    hasCareer: profile.careerYears == null ? '' : profile.careerYears > 0 ? 'yes' : 'no',
    careerYears: profile.careerYears ? String(profile.careerYears) : '',
    certificates: profile.certificates.map((c) => c.certificateType),
    summary: profile.introduction ?? '',
    availableNow: false,
  }
}

/** 저장된 희망조건이 하나라도 있는지 — "서버에서 불러왔다"고 판단하는 기준. */
export function hasSavedConditions(profile: JobSeekerProfileResponseDto): boolean {
  return Boolean(
    profile.desiredJobType ||
      profile.desiredWorkSchedule ||
      profile.desiredRegions.length > 0 ||
      profile.careerYears != null ||
      profile.introduction,
  )
}
