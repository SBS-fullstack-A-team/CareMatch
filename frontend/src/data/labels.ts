/**
 * API enum name → 한글 라벨 매핑.
 * 단일 소스: docs/ENUM_MAPPING.md. JSON 은 항상 enum name 을 주고받고,
 * 화면 표시는 이 맵을 거친다.
 */
import type { EmploymentType, FacilityType, JobCategory, WorkSchedule } from '@/types'

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

/** enum name 을 한글 라벨로. 알 수 없는 값은 원문 그대로 돌려준다. */
export function employmentTypeLabel(type: EmploymentType | string): string {
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
