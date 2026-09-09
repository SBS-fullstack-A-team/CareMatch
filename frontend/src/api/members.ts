/** 회원 API. docs/API.md §2 */
import { apiFetch } from '@/lib/api-client'
import type { DisplayPreference, MyPageResponse } from '@/types/api'

/** 로그인 회원 요약 (이름/유형/포인트/승인상태 등). 미인증이면 401. */
export function getMe(): Promise<MyPageResponse> {
  return apiFetch<MyPageResponse>('/api/members/me')
}

/** 내 화면 표시 설정 조회. 설정한 적 없으면 { easyMode: false, fontScale: 'NORMAL' }. */
export function getDisplayPreference(): Promise<DisplayPreference> {
  return apiFetch<DisplayPreference>('/api/members/me/display-preference')
}

/** 내 화면 표시 설정 변경 (전체 교체 — 두 값 모두 필수). */
export function updateDisplayPreference(pref: DisplayPreference): Promise<DisplayPreference> {
  return apiFetch<DisplayPreference>('/api/members/me/display-preference', {
    method: 'PUT',
    body: pref,
  })
}
