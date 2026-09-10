import type { PayType } from '@/lib/utils'

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
  /** Talent.certificates */
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
  if (!draft.workSchedule) errors.workSchedule = '근무 형태를 선택해 주세요.'
  return errors
}
