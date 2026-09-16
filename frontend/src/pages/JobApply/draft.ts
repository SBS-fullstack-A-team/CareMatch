import { DISTRICT_OPTIONS, SIDO_OPTIONS } from '@/data/filters'
import type { PayType } from '@/lib/utils'

/**
 * 구직신청 폼 값.
 *
 * 필드 이름은 Talent 타입에 맞추고, 서버 프로필(`GET/PUT /api/jobseekers/me`)과의 변환은
 * `profile-mapper.ts` 가 맡는다. 희망 지역은 서버 desiredRegions 의 첫 번째 한 곳만 편집한다.
 *
 * 입력 중에는 숫자도 문자열로 들고 있다가 제출 시점에 변환한다.
 */
export interface JobApplyDraft {
  /** Talent.gender — 서버 gender(FEMALE/MALE) */
  gender: '' | '여' | '남'
  /** Talent.age — 서버는 응답 age / 요청 birthYear */
  age: string
  /** Talent.category — 서버 desiredJobType */
  category: string
  /** 서버 desiredRegions[0].sido */
  sido: string
  /** 서버 desiredRegions[0].sigungu (빈 값이면 시·도 전체) */
  district: string
  /** Talent.workSchedule (WorkSchedule enum name) — 서버 desiredWorkSchedule */
  workSchedule: string
  /** Talent.preferredHours — 서버 desiredWorkDays + desiredWorkStartTime/EndTime 을 합친 표시용 문자열 */
  preferredHours: string
  /** Talent.payType — 서버 desiredPayType (대문자) */
  payType: '' | PayType
  /** Talent.payAmount (원 단위) — 서버 desiredMinPay */
  payAmount: string
  /** Talent.careerYears 입력 보조 — 신입이면 경력 연수를 받지 않는다 (서버로는 보내지 않음) */
  hasCareer: '' | 'yes' | 'no'
  careerYears: string
  /**
   * Talent.certificates — CertificateType enum name 배열 (docs/ENUM_MAPPING.md §5).
   * 서버에 등록된 자격증을 보여주기만 한다 (등록/관리는 마이페이지, PUT 에 포함하지 않음).
   */
  certificates: string[]
  /** Talent.summary — 서버 introduction */
  summary: string
  /** Talent.availableNow — 서버에 대응 필드가 없어 저장되지 않는다 */
  availableNow: boolean
}

/**
 * 근무 시간대(WorkSchedule)별 희망 근무시간 기본 문구.
 * 시간대를 고르면 이 값으로 채워 넣고, 사용자가 직접 고쳐 쓸 수 있다.
 * "HH:mm ~ HH:mm" 을 포함해 두면 profile-mapper 가 서버의
 * desiredWorkStartTime/EndTime 으로 분해해 저장한다 (교대는 시각이 정해지지 않아 문구만).
 */
export const PREFERRED_HOURS_BY_SCHEDULE: Record<string, string> = {
  DAY: '평일 종일 (09:00 ~ 18:00)',
  MORNING: '평일 오전 (09:00 ~ 13:00)',
  AFTERNOON: '평일 오후 (13:00 ~ 18:00)',
  NIGHT: '야간 (21:00 ~ 07:00)',
  SHIFT: '교대 근무 협의',
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

/**
 * localStorage 키 — use-app 의 `carematch.fontScale` / `carematch.easyMode` 규칙을 따른다.
 * 서버 프로필과 동등한 원본이 아니라 "임시저장" 전용이다. 자동으로 폼에 적용하지 않고,
 * 사용자가 불러오기를 눌렀을 때만 쓴다. 서버 저장에 성공하면 지운다.
 */
export const DRAFT_KEY = 'carematch.jobApply.draft'

/*
 * 서버가 받아들이는 값 목록 (docs/ENUM_MAPPING.md).
 * 화면 옵션 목록이 아니라 "서버 enum" 기준이다 — 직종 ETC 처럼 화면 선택지에는 없지만
 * 서버에는 있는 값도 포함해야 한다. 이 목록에 없는 값을 보내면 서버가 본문 파싱 단계에서
 * 막아 400(COMMON_001, 필드별 오류 없음)을 돌려준다.
 */
const JOB_TYPES = [
  'CAREGIVER',
  'CARE_ATTENDANT',
  'NURSE_AIDE',
  'SOCIAL_WORKER',
  'LIFE_SUPPORT',
  'HOUSEKEEPER',
  'ETC',
]
const WORK_SCHEDULES = ['DAY', 'MORNING', 'AFTERNOON', 'NIGHT', 'SHIFT']
const CERTIFICATE_TYPES = [
  'CAREGIVER',
  'NURSE_AIDE',
  'SOCIAL_WORKER_1',
  'SOCIAL_WORKER_2',
  'CARE_ASSISTANT',
  'DRIVER_LICENSE',
  'OTHER',
]
/** 폼이 쓰는 소문자 급여 형태 — 서버로 보낼 때 대문자로 바꾼다 (profile-mapper) */
const PAY_TYPES = ['hourly', 'daily', 'monthly']
const GENDERS = ['여', '남']

/**
 * 오래된 임시저장 정리.
 *
 * enum 전환(2026-09) 이전 임시저장에는 직종이 "요양보호사", 근무 시간대가 "주간" 같은
 * 한글 값으로 들어 있다. 그대로 두면 화면에는 정상처럼 보이지만 저장할 때 서버가 거절한다.
 * 알아볼 수 없는 값은 비워서 사용자가 다시 고르게 한다.
 */
function sanitizeDraft(draft: JobApplyDraft): JobApplyDraft {
  const sido = SIDO_OPTIONS.some((option) => option.value === draft.sido) ? draft.sido : ''
  const district =
    sido && (DISTRICT_OPTIONS[sido] ?? []).some((option) => option.value === draft.district)
      ? draft.district
      : ''

  return {
    ...draft,
    gender: GENDERS.includes(draft.gender) ? draft.gender : '',
    category: JOB_TYPES.includes(draft.category) ? draft.category : '',
    sido,
    district,
    workSchedule: WORK_SCHEDULES.includes(draft.workSchedule) ? draft.workSchedule : '',
    payType: PAY_TYPES.includes(draft.payType) ? draft.payType : '',
    certificates: draft.certificates.filter((value) => CERTIFICATE_TYPES.includes(value)),
  }
}

/** 임시저장 불러오기. 값이 깨져 있으면 무시한다. */
export function loadDraft(): JobApplyDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<JobApplyDraft>
    return sanitizeDraft({
      ...EMPTY_DRAFT,
      ...parsed,
      // 배열 필드가 다른 타입으로 저장돼 있으면 되돌린다
      certificates: Array.isArray(parsed.certificates) ? parsed.certificates : [],
    })
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

/**
 * 에러를 표시할 수 있는 필드.
 * category · sido · workSchedule 은 필수 — 이 셋이 없으면 인재정보 검색·필터에서 아예 걸리지 않는다.
 * 나머지는 입력했을 때만 형식을 확인한다 (preferredHours · summary 는 서버 검증 에러 표시용).
 */
export type DraftField =
  | 'category'
  | 'sido'
  | 'workSchedule'
  | 'age'
  | 'careerYears'
  | 'payAmount'
  | 'preferredHours'
  | 'summary'

/** 서버 desiredMinPay 는 Integer 라 이 값을 넘으면 요청 자체가 거절된다 */
const MAX_INT = 2_147_483_647

const isInteger = (value: string) => /^\d+$/.test(value.trim())

export function validateDraft(draft: JobApplyDraft) {
  const errors: Partial<Record<DraftField, string>> = {}
  if (!draft.category) errors.category = '희망 직종을 선택해 주세요.'
  if (!draft.sido) errors.sido = '희망 지역을 선택해 주세요.'
  if (!draft.workSchedule) errors.workSchedule = '근무 시간대를 선택해 주세요.'

  // 서버는 출생연도 범위를 검사하지 않아 여기서 막는다
  if (draft.age.trim()) {
    const age = Number(draft.age)
    if (!isInteger(draft.age) || age < 19 || age > 99) {
      errors.age = '나이는 19~99 사이의 숫자로 입력해 주세요.'
    }
  }

  // "경력 있음"인데 연수가 비거나 0이면 저장 후 다시 불러올 때 경력 여부가 달라진다
  if (draft.hasCareer === 'yes') {
    const years = Number(draft.careerYears)
    if (!isInteger(draft.careerYears) || years < 1 || years > 50) {
      errors.careerYears = '경력 연수를 1~50년 사이로 입력해 주세요.'
    }
  }

  // 서버 desiredMinPay 는 양수만 허용한다
  if (draft.payAmount.trim()) {
    const pay = Number(draft.payAmount)
    if (!isInteger(draft.payAmount) || pay < 1 || pay > MAX_INT) {
      errors.payAmount = '희망 최소 급여는 1원 이상의 숫자로 입력해 주세요.'
    }
  }

  return errors
}
