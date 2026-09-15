import type { MemberRole } from '@/types/api'

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

/**
 * 역할별 주 메뉴 — 그 역할이 쓸 수 없는 화면은 감춘다.
 * - 구직자: 인재정보 제외 (인재 열람은 시설·보호자·관리자 전용)
 * - 보호자·시설: 구직신청 제외 (구직 프로필 등록은 구직자 전용)
 * - 관리자: 계정 관리를 위해 전체
 * - 비로그인·유형 미선택(GUEST): 전체를 보여주고, 들어가면 각 화면이 로그인·유형 안내를 한다
 */
export function mainNavFor(role: MemberRole | null | undefined): NavItem[] {
  if (role === 'JOBSEEKER') return MAIN_NAV.filter((item) => item.to !== '/talents')
  if (role === 'FACILITY' || role === 'GENERAL') {
    return MAIN_NAV.filter((item) => item.to !== '/apply')
  }
  return MAIN_NAV
}

/** DESIGN_SYSTEM.md §26 */
export const FOOTER_NAV: NavItem[] = [
  { to: '/about', label: '회사소개' },
  { to: '/terms', label: '이용약관' },
  { to: '/privacy', label: '개인정보처리방침' },
  { to: '/support', label: '고객센터' },
]
