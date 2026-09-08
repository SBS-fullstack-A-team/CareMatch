import type { Talent } from '@/types'

/**
 * 최신 인재정보 데모 데이터. `capture/메인.png` 기준.
 * 이름은 데이터에 실명으로 두고, 화면에서는 maskName() 으로 마스킹한다.
 * (DESIGN_SYSTEM.md §21)
 */
export const TALENTS: Talent[] = [
  {
    id: 'talent-501',
    name: '김정회',
    gender: '여',
    age: 52,
    category: '요양보호사',
    regions: ['서울 강남구'],
    certificates: ['요양보호사 1급'],
    updatedAt: '2025-08-20',
    careerLabel: '경력 7년 4개월',
    careerYears: 7,
    preferredHours: '평일 오전 (09:00 ~ 13:00)',
    payType: 'hourly',
    payAmount: 14000,
    summary: '방문요양 7년 경력으로 치매 어르신 케어 경험이 많습니다.',
    availableNow: true,
  },
  {
    id: 'talent-502',
    name: '이선영',
    gender: '여',
    age: 47,
    category: '간병인',
    regions: ['경기 성남시 분당구'],
    certificates: ['요양보호사 1급'],
    updatedAt: '2025-08-19',
    careerLabel: '경력 3년 1개월',
    careerYears: 3,
    preferredHours: '평일 종일 (09:00 ~ 18:00)',
    payType: 'monthly',
    payAmount: 2500000,
    summary: '요양병원 간병 경력으로 와상 어르신 케어가 가능합니다.',
    availableNow: true,
  },
  {
    id: 'talent-503',
    name: '박미경',
    gender: '여',
    age: 55,
    category: '요양보호사',
    regions: ['서울 송파구'],
    certificates: ['요양보호사 1급'],
    updatedAt: '2025-08-18',
    careerLabel: '경력 9년 2개월',
    careerYears: 9,
    preferredHours: '평일 오후 (13:00 ~ 18:00)',
    payType: 'hourly',
    payAmount: 13500,
    summary: '주야간보호센터 프로그램 보조와 식사 지원에 익숙합니다.',
    availableNow: false,
  },
  {
    id: 'talent-504',
    name: '최은정',
    gender: '여',
    age: 49,
    category: '가사도우미',
    regions: ['경기 수원시 영통구'],
    certificates: ['요양보호사 1급'],
    updatedAt: '2025-08-17',
    careerLabel: '경력 5년 6개월',
    careerYears: 5,
    preferredHours: '평일 오전·오후 협의',
    payType: 'hourly',
    payAmount: 15000,
    summary: '가정 방문 가사 지원 경력으로 정리수납과 조리 보조가 가능합니다.',
    availableNow: true,
  },
]

/** 최신 인재정보 — 4열 */
export const LATEST_TALENTS = TALENTS.slice(0, 4)

export function getTalentById(id: string) {
  return TALENTS.find((talent) => talent.id === id)
}
