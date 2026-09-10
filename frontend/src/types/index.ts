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

/** 시설 유형 */
export type FacilityType =
  | '방문요양센터'
  | '요양원'
  | '주야간보호센터'
  | '재가복지센터'
  | '요양병원'

/** 근무 형태 */
export type EmploymentType = '정규직' | '계약직' | '시간제' | '파트타임' | '단기'

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
  /** 근무 형태 ex) "주간", "오전", "야간" */
  workType: string
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
  certificates: string[]
  /** 프로필 사진 경로. 없으면 동일 크기의 원형 placeholder */
  photoUrl?: string
  /** 갱신일 ISO date */
  updatedAt: string
  /** ---- 아래는 인재정보 목록/상세 화면용. 메인에서는 사용하지 않는다 ---- */
  careerLabel?: string
  careerYears?: number
  /**
   * 희망 근무형태 ex) "주간", "오전". Job.workType 과 같은 값 체계를 쓴다.
   * preferredHours 는 구체적인 희망 시간대 자유 텍스트라 검색·필터 기준으로는 쓰지 않는다.
   */
  workType?: string
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
