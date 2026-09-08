export interface NavItem {
  to: string
  label: string
}

/** GNB 주 메뉴 — 모바일 메뉴와 동일한 정의를 공유한다 */
export const MAIN_NAV: NavItem[] = [
  { to: '/jobs', label: '구인공고' },
  { to: '/talents', label: '인재정보' },
  { to: '/nearby', label: '내 주변 일자리' },
  { to: '/apply', label: '구직신청' },
  { to: '/support', label: '고객센터' },
]

/** DESIGN_SYSTEM.md §26 */
export const FOOTER_NAV: NavItem[] = [
  { to: '/about', label: '회사소개' },
  { to: '/terms', label: '이용약관' },
  { to: '/privacy', label: '개인정보처리방침' },
  { to: '/support', label: '고객센터' },
]
