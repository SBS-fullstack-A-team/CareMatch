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

const toOptions = (names: string[]): SelectOption[] => names.map((name) => ({ value: name, label: name }))

/**
 * 시·도별 구·군 (검색 패널 "구·군" 필드). 실제 행정구역 전체(기초자치단체 + 다구 시의 구) 기준.
 * 세종특별자치시는 기초자치단체(구/군) 자체가 없는 단일 행정구역이라, 대신 대표 읍·면·동을 넣었다.
 * 2023-07 군위군의 경북→대구 편입 반영(대구=7구2군, 경북=10시12군).
 */
export const DISTRICT_OPTIONS: Record<string, SelectOption[]> = {
  서울특별시: toOptions([
    '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구',
    '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구',
    '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구',
  ]),
  경기도: toOptions([
    '수원시 장안구', '수원시 권선구', '수원시 팔달구', '수원시 영통구',
    '성남시 수정구', '성남시 중원구', '성남시 분당구',
    '의정부시', '안양시 만안구', '안양시 동안구', '부천시', '광명시', '평택시', '동두천시',
    '안산시 상록구', '안산시 단원구',
    '고양시 덕양구', '고양시 일산동구', '고양시 일산서구',
    '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시',
    '용인시 처인구', '용인시 기흥구', '용인시 수지구',
    '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '양주시', '포천시', '여주시',
    '연천군', '가평군', '양평군',
  ]),
  인천광역시: toOptions([
    '중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군',
  ]),
  부산광역시: toOptions([
    '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구',
    '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군',
  ]),
  대구광역시: toOptions([
    '중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군',
  ]),
  광주광역시: toOptions(['동구', '서구', '남구', '북구', '광산구']),
  대전광역시: toOptions(['동구', '중구', '서구', '유성구', '대덕구']),
  울산광역시: toOptions(['중구', '남구', '동구', '북구', '울주군']),
  세종특별자치시: toOptions(['조치원읍', '한솔동', '도담동', '새롬동']),
  강원특별자치도: toOptions([
    '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
    '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군',
  ]),
  충청북도: toOptions([
    '청주시 상당구', '청주시 서원구', '청주시 흥덕구', '청주시 청원구',
    '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군',
  ]),
  충청남도: toOptions([
    '천안시 동남구', '천안시 서북구',
    '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시',
    '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군',
  ]),
  전북특별자치도: toOptions([
    '전주시 완산구', '전주시 덕진구', '군산시', '익산시', '정읍시', '남원시', '김제시',
    '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군',
  ]),
  전라남도: toOptions([
    '목포시', '여수시', '순천시', '나주시', '광양시',
    '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군',
    '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군',
  ]),
  경상북도: toOptions([
    '포항시 남구', '포항시 북구',
    '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시',
    '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군',
  ]),
  경상남도: toOptions([
    '창원시 의창구', '창원시 성산구', '창원시 마산합포구', '창원시 마산회원구', '창원시 진해구',
    '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시',
    '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군',
  ]),
  제주특별자치도: toOptions(['제주시', '서귀포시']),
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

/** 자격증 — value 는 API enum name(CertificateType), label 은 한글 (docs/ENUM_MAPPING.md §5) */
export const CERTIFICATE_OPTIONS: SelectOption[] = [
  { value: 'CAREGIVER', label: '요양보호사' },
  { value: 'NURSE_AIDE', label: '간호조무사' },
  { value: 'SOCIAL_WORKER_1', label: '사회복지사 1급' },
  { value: 'SOCIAL_WORKER_2', label: '사회복지사 2급' },
  { value: 'CARE_ASSISTANT', label: '간병사' },
  { value: 'DRIVER_LICENSE', label: '운전면허' },
  { value: 'OTHER', label: '기타' },
]
