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

/**
 * 내 전화번호 등록/변경. 소셜 가입자처럼 가입 시 전화번호가 없던 경우나, 자격증 등록에
 * 필요한 휴대폰 인증 전에 번호를 (재)등록할 때 쓴다. 등록만으로 인증되지는 않는다 —
 * 이어서 /api/verifications/{send,verify} 로 별도 인증해야 한다.
 */
export function updateMyPhone(phone: string): Promise<void> {
  return apiFetch<void>('/api/members/me/phone', { method: 'PUT', body: { phone } })
}
