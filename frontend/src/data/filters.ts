import type { SelectOption } from '@/components/ui/select'

/** 시·도 (검색 패널 "지역" 필드) */
export const SIDO_OPTIONS: SelectOption[] = [
  { value: '서울특별시', label: '서울특별시' },
  { value: '경기도', label: '경기도' },
  { value: '인천광역시', label: '인천광역시' },
  { value: '부산광역시', label: '부산광역시' },
  { value: '대구광역시', label: '대구광역시' },
  { value: '대전광역시', label: '대전광역시' },
  { value: '광주광역시', label: '광주광역시' },
  { value: '울산광역시', label: '울산광역시' },
  { value: '세종특별자치시', label: '세종특별자치시' },
  { value: '강원특별자치도', label: '강원특별자치도' },
  { value: '충청북도', label: '충청북도' },
  { value: '충청남도', label: '충청남도' },
  { value: '전북특별자치도', label: '전북특별자치도' },
  { value: '전라남도', label: '전라남도' },
  { value: '경상북도', label: '경상북도' },
  { value: '경상남도', label: '경상남도' },
  { value: '제주특별자치도', label: '제주특별자치도' },
]

/** 시·도별 구·군 (검색 패널 "구·군" 필드) */
export const DISTRICT_OPTIONS: Record<string, SelectOption[]> = {
  서울특별시: [
    '강남구',
    '강동구',
    '강북구',
    '강서구',
    '관악구',
    '광진구',
    '구로구',
    '노원구',
    '동대문구',
    '동작구',
    '마포구',
    '서대문구',
    '서초구',
    '성동구',
    '송파구',
    '양천구',
    '영등포구',
    '은평구',
    '종로구',
    '중랑구',
  ].map((name) => ({ value: name, label: name })),
  경기도: [
    '성남시 분당구',
    '수원시 영통구',
    '의정부시',
    '고양시 일산동구',
    '용인시 수지구',
    '부천시',
    '안양시 동안구',
    '남양주시',
  ].map((name) => ({ value: name, label: name })),
  인천광역시: ['부평구', '남동구', '연수구', '서구', '미추홀구'].map((name) => ({
    value: name,
    label: name,
  })),
}

/** 지역별 바로가기 (DESIGN_SYSTEM.md §22) */
export const REGION_SHORTCUTS = [
  { label: '서울', sido: '서울특별시' },
  { label: '경기', sido: '경기도' },
  { label: '인천', sido: '인천광역시' },
  { label: '부산', sido: '부산광역시' },
  { label: '대구', sido: '대구광역시' },
  { label: '대전', sido: '대전광역시' },
  { label: '광주', sido: '광주광역시' },
  { label: '울산', sido: '울산광역시' },
  { label: '세종', sido: '세종특별자치시' },
  { label: '강원', sido: '강원특별자치도' },
  { label: '충북', sido: '충청북도' },
  { label: '충남', sido: '충청남도' },
  { label: '전북', sido: '전북특별자치도' },
  { label: '전남', sido: '전라남도' },
  { label: '경북', sido: '경상북도' },
  { label: '경남', sido: '경상남도' },
  { label: '제주', sido: '제주특별자치도' },
]

/** 직종 — value 는 API enum name, label 은 한글 (docs/ENUM_MAPPING.md §1) */
export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'CAREGIVER', label: '요양보호사' },
  { value: 'CARE_ATTENDANT', label: '간병인' },
  { value: 'NURSE_AIDE', label: '간호조무사' },
  { value: 'SOCIAL_WORKER', label: '사회복지사' },
  { value: 'LIFE_SUPPORT', label: '생활지원사' },
  { value: 'HOUSEKEEPER', label: '가사도우미' },
]

/** 시설유형 — value 는 API enum name, label 은 한글 (docs/ENUM_MAPPING.md §4) */
export const FACILITY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'VISITING_CARE', label: '방문요양센터' },
  { value: 'NURSING_HOME', label: '요양원' },
  { value: 'DAY_NIGHT_CARE', label: '주야간보호센터' },
  { value: 'COMMUNITY_CARE', label: '재가복지센터' },
  { value: 'NURSING_HOSPITAL', label: '요양병원' },
]

/** 고용형태 — value 는 API enum name, label 은 한글 (docs/ENUM_MAPPING.md §3) */
export const EMPLOYMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'FULL_TIME', label: '정규직' },
  { value: 'CONTRACT', label: '계약직' },
  { value: 'PART_TIME', label: '파트타임' },
  { value: 'TEMPORARY', label: '단기' },
]

export const WORK_TIME_OPTIONS: SelectOption[] = [
  { value: 'morning', label: '오전 (06:00 ~ 12:00)' },
  { value: 'afternoon', label: '오후 (12:00 ~ 18:00)' },
  { value: 'evening', label: '저녁 (18:00 ~ 22:00)' },
  { value: 'night', label: '야간·상주' },
  { value: 'shift', label: '교대 근무' },
]

/**
 * 구인공고 목록 정렬.
 * 위치 기반 기능이 없어 거리순은 두지 않고, 실제로 계산 가능한 3종만 제공한다.
 */
export const JOB_SORT_OPTIONS: SelectOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'payDesc', label: '급여 높은순' },
  { value: 'payAsc', label: '급여 낮은순' },
]

/**
 * 근무 시간대 — value 는 API enum name(WorkSchedule), label 은 한글 (docs/ENUM_MAPPING.md §2).
 * (WORK_TIME_OPTIONS 는 시간대 범위를 고르는 등록 폼용이라 용도가 다르다)
 */
export const WORK_SCHEDULE_OPTIONS: SelectOption[] = [
  { value: 'DAY', label: '주간' },
  { value: 'MORNING', label: '오전' },
  { value: 'AFTERNOON', label: '오후' },
  { value: 'NIGHT', label: '야간' },
  { value: 'SHIFT', label: '교대' },
]

/** 급여 형태 — Job.payType 중 목록 필터에서 사용하는 3종 */
export const PAY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'hourly', label: '시급' },
  { value: 'daily', label: '일급' },
  { value: 'monthly', label: '월급' },
]

/* ---------------------------------------------------------------------------
   인재정보 목록
   --------------------------------------------------------------------------- */

/**
 * 인재정보 정렬.
 * Talent 에는 createdAt 이 없고 updatedAt 만 있어 "최신 등록순" 대신 "최근 수정순"을 쓴다.
 * 나머지는 careerYears 로 계산 가능한 2종만 제공한다.
 */
export const TALENT_SORT_OPTIONS: SelectOption[] = [
  { value: 'updated', label: '최근 수정순' },
  { value: 'careerDesc', label: '경력 높은순' },
  { value: 'careerAsc', label: '경력 낮은순' },
]

/** 경력 구간 — Talent.careerYears 를 나누는 기준 (value 가 곧 구간 키) */
export const CAREER_OPTIONS: SelectOption[] = [
  { value: 'entry', label: '신입' },
  { value: '1-3', label: '1~3년' },
  { value: '3-5', label: '3~5년' },
  { value: '5+', label: '5년 이상' },
]

/** 자격증 — Talent.certificates 에 실제로 들어 있는 값들 */
export const CERTIFICATE_OPTIONS: SelectOption[] = [
  { value: '요양보호사 1급', label: '요양보호사 1급' },
  { value: '요양보호사 2급', label: '요양보호사 2급' },
  { value: '간호조무사', label: '간호조무사' },
  { value: '사회복지사 2급', label: '사회복지사 2급' },
  { value: '간병사', label: '간병사' },
  { value: '치매전문교육 이수', label: '치매전문교육 이수' },
  { value: '운전면허 2종', label: '운전면허 2종' },
]
