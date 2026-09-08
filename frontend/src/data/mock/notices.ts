import type { Notice } from '@/types'

/** 공지사항 — 메인에는 최대 3개만 노출한다 (DESIGN_SYSTEM.md §23) */
export const NOTICES: Notice[] = [
  {
    id: 'notice-31',
    title: '케어매치 서비스 이용약관이 개정되었습니다.',
    postedAt: '2025-08-20',
  },
  {
    id: 'notice-30',
    title: '구인공고 등록 시 유의사항 안내',
    postedAt: '2025-08-15',
  },
  {
    id: 'notice-29',
    title: '추석 연휴 고객센터 운영 안내',
    postedAt: '2025-08-10',
  },
]
