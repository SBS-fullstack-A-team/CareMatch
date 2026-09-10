/** 회원 API. docs/API.md §2 */
import { apiFetch } from '@/lib/api-client'
import type {
  DisplayPreference,
  ExistsResponse,
  JobSeekerSignupRequest,
  MyPageResponse,
  SignupResponse,
} from '@/types/api'

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

/**
 * 아이디/이메일 중복 확인. 쿼리로 보낸 항목의 키만 응답에 담겨 온다.
 * (MemberController#checkExists — 둘 중 하나 이상 전달)
 */
export function checkExists(params: { loginId?: string; email?: string }): Promise<ExistsResponse> {
  const query = new URLSearchParams()
  if (params.loginId) query.set('loginId', params.loginId)
  if (params.email) query.set('email', params.email)
  return apiFetch<ExistsResponse>(`/api/members/exists?${query.toString()}`, { auth: false })
}

/**
 * 구직자(개인회원) 회원가입. 성공해도 토큰은 오지 않으므로 가입 후 별도 로그인이 필요하다.
 * 실패 시 ApiError — fieldErrors 로 필드별 서버 검증 메시지가 온다.
 */
export function signupJobSeeker(req: JobSeekerSignupRequest): Promise<SignupResponse> {
  return apiFetch<SignupResponse>('/api/members/jobseekers', {
    method: 'POST',
    auth: false,
    body: req,
  })
}
