import type { PayType } from '@/lib/utils'

/**
 * 직종. 값은 API enum name (docs/ENUM_MAPPING.md §1). 한글 라벨은 JOB_CATEGORY_LABELS.
 */
export type JobCategory =
  | 'CAREGIVER' // 요양보호사
  | 'CARE_ATTENDANT' // 간병인
  | 'NURSE_AIDE' // 간호조무사
  | 'SOCIAL_WORKER' // 사회복지사
  | 'LIFE_SUPPORT' // 생활지원사
  | 'HOUSEKEEPER' // 가사도우미
  | 'ETC' // 기타

/**
 * 근무 시간대. 값은 API enum name (docs/ENUM_MAPPING.md §2). 한글 라벨은 WORK_SCHEDULE_LABELS.
 * "어디서 자느냐"(출퇴근/입주 = 백엔드 WorkType)와 다른 축인 "언제 일하느냐".
 */
export type WorkSchedule = 'DAY' | 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'SHIFT'

/**
 * 시설 유형. 값은 API enum name (docs/ENUM_MAPPING.md §4). 한글 라벨은 FACILITY_TYPE_LABELS.
 */
export type FacilityType =
  | 'VISITING_CARE' // 방문요양센터
  | 'NURSING_HOME' // 요양원
  | 'DAY_NIGHT_CARE' // 주야간보호센터
  | 'COMMUNITY_CARE' // 재가복지센터
  | 'NURSING_HOSPITAL' // 요양병원
  | 'ETC' // 기타

/**
 * 고용형태. 값은 API enum name (docs/ENUM_MAPPING.md §3). 한글 라벨은 EMPLOYMENT_TYPE_LABELS.
 */
export type EmploymentType =
  | 'FULL_TIME' // 정규직
  | 'CONTRACT' // 계약직
  | 'TEMPORARY' // 단기
  | 'PART_TIME' // 파트타임(시간제)

/**
 * 자격증 종류. 값은 API enum name (docs/ENUM_MAPPING.md §5). 한글 라벨은 CERTIFICATE_TYPE_LABELS.
 * 인재 검색 필터의 자격증 축(certificateTypes) 값이기도 하다.
 */
export type CertificateType =
  | 'CAREGIVER' // 요양보호사
  | 'NURSE_AIDE' // 간호조무사
  | 'SOCIAL_WORKER_1' // 사회복지사 1급
  | 'SOCIAL_WORKER_2' // 사회복지사 2급
  | 'CARE_ASSISTANT' // 간병사
  | 'DRIVER_LICENSE' // 운전면허
  | 'OTHER' // 기타

/**
 * 공고 상태 배지 (DESIGN_SYSTEM.md §14)
 * 카드에서는 special / premium 만 노출하고,
 * 메인 최신 구인공고 TABLE 에서는 5종을 모두 노출한다.
 */
export type JobStatus = 'special' | 'premium' | 'new' | 'normal' | 'closing'

/** 매칭 점수 산출 사유 */
export type MatchingReasonKind =
  | 'region'
  | 'schedule'
  | 'pay'
  | 'category'
  | 'facilityType'
  | 'career'

export interface MatchingReason {
  kind: MatchingReasonKind
  /** ex) "지역 일치" */
  label: string
  /** 충족 여부. false면 미충족 사유로 표시된다 */
  matched: boolean
  /** ex) "서울 강남구" */
  detail?: string
}

export interface Matching {
  /** 0~100 */
  score: number
  reasons: MatchingReason[]
}

/** 어르신 정보 (COMPONENT_RULES.md §23 ElderlyInfoCard) */
export interface ElderlyInfo {
  /** 장기요양등급 ex) "4등급" */
  grade: string
  /** 무관: 여러 어르신을 함께 돌보는 시설 공고 */
  gender: '여' | '남' | '무관'
  /** ex) "80대" */
  ageGroup: string
  /** 거동 ex) "보행 가능" */
  mobility: string
  /** 식사 ex) "자립" */
  meal?: string
  /** 인지 상태 ex) "경증 치매" */
  cognition?: string
  /** 업무 항목 ex) ["세면", "식사준비", "말벗"] */
  careTasks?: string[]
  /** 특이사항 */
  note?: string
}

export interface Job {
  id: string
  /** 공고 제목 ex) "요양보호사 모집" */
  title: string
  facilityName: string
  facilityType: FacilityType
  /** ex) "서울 강남구" */
  region: string
  /** ex) "역삼동" */
  district?: string
  category: JobCategory
  employmentType: EmploymentType
  /** 근무 시간대. 입주형 등 미지정이면 null (시각만 노출) */
  workSchedule: WorkSchedule | null
  /** 근무 시간 ex) "09:00~13:00" */
  workHours: string
  /** 근무 요일 ex) "주 5일 (월~금)" — 상세 화면용 */
  workDays?: string
  payType: PayType
  payAmount?: number
  status: JobStatus
  /** ISO date */
  postedAt: string
  /** ISO date. 없으면 상시채용 */
  deadline?: string
  /** 스페셜 카드의 짧은 홍보 문구 */
  catchphrase?: string
  /**
   * 시설 사진 경로. 없으면 동일한 크기의 placeholder 를 렌더링한다.
   * (DESIGN_SYSTEM.md §32)
   */
  imageUrl?: string
  viewCount: number
  applicantCount: number
  matching?: Matching
  /** 목록/상세에서 사용하는 우대 조건 태그 */
  tags?: string[]
  /** 방문요양·간병처럼 담당 어르신이 특정되는 공고에만 존재한다 */
  elderly?: ElderlyInfo
  /** 상세 화면용 */
  description?: string
  requirements?: string[]
  preferences?: string[]
  benefits?: string[]
  managerName?: string
  managerPhone?: string
  address?: string
}

export interface Talent {
  id: string
  /** 실명. 화면에는 maskName() 으로 마스킹해 노출한다 (DESIGN_SYSTEM.md §21) */
  name: string
  gender: '여' | '남'
  age: number
  /** 희망 직종 */
  category: JobCategory
  /** 희망 근무 지역 */
  regions: string[]
  /**
   * 보유 자격증 종류 (docs/ENUM_MAPPING.md §5). 검색 필터의 자격증 축과 같은 값 체계.
   * 표시는 certificateTypeLabel() 을 거친다. (OTHER 의 자유 입력 이름은 목록 응답에 없음)
   */
  certificates: CertificateType[]
  /** 프로필 사진 경로. 없으면 동일 크기의 원형 placeholder */
  photoUrl?: string
  /** 갱신일 ISO date */
  updatedAt: string
  /** ---- 아래는 인재정보 목록/상세 화면용. 메인에서는 사용하지 않는다 ---- */
  careerLabel?: string
  careerYears?: number
  /**
   * 희망 근무 시간대. Job.workSchedule 과 같은 값 체계(WorkSchedule).
   * preferredHours 는 구체적인 희망 시간대 자유 텍스트라 검색·필터 기준으로는 쓰지 않는다.
   */
  workSchedule?: WorkSchedule
  /** 구체적인 희망 시간대 ex) "평일 오전 (09:00 ~ 13:00)" */
  preferredHours?: string
  payType?: PayType
  payAmount?: number
  summary?: string
  matching?: Matching
  availableNow?: boolean
}

export interface Notice {
  id: string
  title: string
  /** ISO date */
  postedAt: string
}
