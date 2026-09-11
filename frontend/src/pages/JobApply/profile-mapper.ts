import type {
  ApiGender,
  ApiJobType,
  ApiPayType,
  ApiWorkSchedule,
  JobSeekerProfileResponseDto,
  JobSeekerProfileUpdateRequestDto,
  RegionDto,
} from '@/types/api'
import type { DraftField, JobApplyDraft } from './draft'

/**
 * 서버 구직자 프로필(`/api/jobseekers/me`) ↔ 구직신청 폼 변환.
 *
 * PUT 은 전체 덮어쓰기라(보내지 않은 필드는 서버에서 "없음"으로 저장) 요청은 항상
 * "조회한 서버 프로필"에서 시작하고, 폼이 편집하는 필드만 바꿔 끼운다. 폼에 없는 값
 * (employmentStatus, residence, headline, photoUrl, education, availableTasks,
 * desiredWorkType, desiredEmploymentTypes, 두 번째 이후 희망 지역)은 조회값 그대로 다시 보낸다.
 * 요청 타입이 optional 필드라 "없음"은 undefined(= JSON 에서 생략 → 서버 null)로 표현한다.
 */

type Profile = JobSeekerProfileResponseDto
type UpdateRequest = JobSeekerProfileUpdateRequestDto

const GENDER_TO_FORM: Record<ApiGender, JobApplyDraft['gender']> = { FEMALE: '여', MALE: '남' }
const GENDER_TO_API: Record<string, ApiGender> = { 여: 'FEMALE', 남: 'MALE' }

/**
 * 급여 형태. labels.ts 의 payTypeFromApi/payTypeToApi 는 값이 없으면 MONTHLY 로 채워서
 * "미입력"을 표현할 수 없어 여기서는 쓰지 않는다.
 */
const PAY_TYPE_TO_FORM: Record<ApiPayType, JobApplyDraft['payType']> = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  MONTHLY: 'monthly',
}
const PAY_TYPE_TO_API: Record<string, ApiPayType> = {
  hourly: 'HOURLY',
  daily: 'DAILY',
  monthly: 'MONTHLY',
}

/** null → undefined (요청 타입은 optional 필드) */
const orUndefined = <T>(value: T | null | undefined): T | undefined => value ?? undefined

/** 등록 거절된 자격증은 보유 자격증으로 보여주지 않는다 */
function registeredCertificateTypes(profile: Profile): string[] {
  const types = (profile.certificates ?? [])
    .filter((certificate) => certificate.status !== 'REJECTED')
    .map((certificate) => certificate.certificateType)
  return [...new Set(types)]
}

/* ---------------------------------------------------------------------------
   희망 근무시간 — 서버 desiredWorkDays + desiredWorkStartTime/EndTime ↔ 자유 텍스트 한 줄
   화면 예시 형식 "평일 오전 (09:00 ~ 13:00)" 을 기준으로 한다.
   --------------------------------------------------------------------------- */

/** "09:00:00" / "09:00" → "09:00" */
function toHourMinute(time: string | null): string | null {
  if (!time) return null
  const match = /^(\d{2}):(\d{2})/.exec(time)
  return match ? `${match[1]}:${match[2]}` : null
}

/** 서버 세 필드를 폼 표시 문자열로 합친다. 시각은 시작·종료가 모두 있을 때만 붙인다. */
export function composePreferredHours(profile: Profile): string {
  const days = profile.desiredWorkDays?.trim() ?? ''
  const start = toHourMinute(profile.desiredWorkStartTime)
  const end = toHourMinute(profile.desiredWorkEndTime)
  const range = start && end ? `${start} ~ ${end}` : ''

  if (days && range) return `${days} (${range})`
  return days || range
}

const TIME_RANGE = /(\d{1,2}):(\d{2})\s*[~\-–]\s*(\d{1,2}):(\d{2})/

type WorkHours = Pick<UpdateRequest, 'desiredWorkDays' | 'desiredWorkStartTime' | 'desiredWorkEndTime'>

/**
 * 폼 문자열 → 서버 세 필드.
 * - 불러온 문자열에서 바뀌지 않았으면 서버 값을 그대로 보존한다 (재조합 과정의 손실 방지).
 * - "HH:mm ~ HH:mm" 이 올바른 시각으로 들어 있을 때만 시작/종료 시각을 만든다.
 *   나머지 설명(요일 등)은 desiredWorkDays 로 보낸다.
 * - 시각 범위를 찾지 못하면 시각을 만들어내지 않고 문구 전체를 desiredWorkDays 로 보낸다.
 *   (사용자가 문구에서 시각을 지웠다는 뜻이므로, 이전 시각을 남기면 새로고침 후 화면이 입력과 달라진다)
 */
export function toWorkHours(text: string, profile: Profile): WorkHours {
  if (text === composePreferredHours(profile)) {
    return {
      desiredWorkDays: orUndefined(profile.desiredWorkDays),
      desiredWorkStartTime: orUndefined(profile.desiredWorkStartTime),
      desiredWorkEndTime: orUndefined(profile.desiredWorkEndTime),
    }
  }

  const trimmed = text.trim()
  if (!trimmed) return {}

  const match = TIME_RANGE.exec(trimmed)
  const start = match ? validTime(match[1], match[2]) : null
  const end = match ? validTime(match[3], match[4]) : null

  if (!match || !start || !end) return { desiredWorkDays: trimmed }

  const days = trimmed
    .replace(match[0], '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return { desiredWorkDays: days || undefined, desiredWorkStartTime: start, desiredWorkEndTime: end }
}

function validTime(hour: string, minute: string): string | null {
  const h = Number(hour)
  const m = Number(minute)
  if (h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${minute}`
}

/* ---------------------------------------------------------------------------
   희망 지역 — 폼은 첫 번째 한 곳만 편집한다
   --------------------------------------------------------------------------- */

const sameRegion = (a: RegionDto, b: RegionDto) =>
  a.sido === b.sido && (a.sigungu || null) === (b.sigungu || null)

/** [폼에서 편집한 첫 지역, ...서버의 두 번째 이후 지역]. 첫 지역과 겹치는 기존 지역은 뺀다 (최대 3개 유지). */
function toRegions(draft: JobApplyDraft, profile: Profile): RegionDto[] {
  const rest = (profile.desiredRegions ?? []).slice(1)
  if (!draft.sido) return rest

  const first: RegionDto = { sido: draft.sido, sigungu: draft.district || null }
  return [first, ...rest.filter((region) => !sameRegion(region, first))]
}

/* ---------------------------------------------------------------------------
   변환
   --------------------------------------------------------------------------- */

/** 서버 프로필 → 폼. availableNow 는 서버에 없어 항상 false 로 시작한다. */
export function profileToDraft(profile: Profile): JobApplyDraft {
  const firstRegion = profile.desiredRegions?.[0]
  const careerYears = profile.careerYears

  return {
    gender: profile.gender ? (GENDER_TO_FORM[profile.gender] ?? '') : '',
    age: profile.age == null ? '' : String(profile.age),
    category: profile.desiredJobType ?? '',
    sido: firstRegion?.sido ?? '',
    district: firstRegion?.sigungu ?? '',
    workSchedule: profile.desiredWorkSchedule ?? '',
    preferredHours: composePreferredHours(profile),
    payType: profile.desiredPayType ? (PAY_TYPE_TO_FORM[profile.desiredPayType] ?? '') : '',
    payAmount: profile.desiredMinPay == null ? '' : String(profile.desiredMinPay),
    hasCareer: careerYears == null ? '' : careerYears > 0 ? 'yes' : 'no',
    careerYears: careerYears != null && careerYears > 0 ? String(careerYears) : '',
    certificates: registeredCertificateTypes(profile),
    summary: profile.introduction ?? '',
    availableNow: false,
  }
}

/**
 * 조회한 서버 프로필 + 폼 → PUT 요청 전체.
 * 응답 전용 필드(profileId, memberId, name, phone, certificates, contactUnlocked, unlockCost,
 * matchingScore, postingMatches, age)는 넣지 않는다. 자격증·availableNow 는 서버에 저장하지 않는다.
 * validateDraft 를 통과한 폼을 전제로 한다.
 */
export function buildUpdateRequest(
  profile: Profile,
  draft: JobApplyDraft,
  currentYear: number = new Date().getFullYear(),
): UpdateRequest {
  const age = draft.age.trim() ? Number(draft.age) : null
  const pay = draft.payAmount.trim() ? Number(draft.payAmount) : null

  return {
    // --- 폼에 없는 값: 조회값 그대로 (employmentStatus 도 임의로 바꾸지 않는다) ---
    employmentStatus: profile.employmentStatus,
    residence: orUndefined(profile.residence),
    photoUrl: orUndefined(profile.photoUrl),
    education: orUndefined(profile.education),
    headline: orUndefined(profile.headline),
    availableTasks: profile.availableTasks ?? [],
    desiredWorkType: orUndefined(profile.desiredWorkType),
    desiredEmploymentTypes: profile.desiredEmploymentTypes ?? [],

    // --- 폼에서 편집하는 값 ---
    gender: GENDER_TO_API[draft.gender],
    birthYear: age == null ? undefined : currentYear - age,
    careerYears:
      draft.hasCareer === 'yes' ? Number(draft.careerYears) : draft.hasCareer === 'no' ? 0 : undefined,
    introduction: draft.summary.trim() ? draft.summary : undefined,
    desiredJobType: (draft.category || undefined) as ApiJobType | undefined,
    desiredWorkSchedule: (draft.workSchedule || undefined) as ApiWorkSchedule | undefined,
    desiredRegions: toRegions(draft, profile),
    desiredPayType: PAY_TYPE_TO_API[draft.payType],
    desiredMinPay: pay != null && pay > 0 ? pay : undefined,
    ...toWorkHours(draft.preferredHours, profile),
  }
}

/** 서버 검증 에러(fieldErrors.field) → 폼 필드. 대응하는 입력이 없으면 null (폼 상단 메시지로 표시). */
export function toDraftField(serverField: string): DraftField | null {
  if (serverField.startsWith('desiredRegions')) return 'sido'
  switch (serverField) {
    case 'desiredJobType':
      return 'category'
    case 'desiredWorkSchedule':
      return 'workSchedule'
    case 'birthYear':
      return 'age'
    case 'careerYears':
      return 'careerYears'
    case 'desiredMinPay':
      return 'payAmount'
    case 'desiredWorkDays':
    case 'desiredWorkStartTime':
    case 'desiredWorkEndTime':
      return 'preferredHours'
    case 'introduction':
      return 'summary'
    default:
      return null
  }
}
