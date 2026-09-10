/** 인증 API. docs/API.md §3 */
import { apiFetch } from '@/lib/api-client'
import { tokenStore } from '@/lib/token-store'
import type { SocialRoleSelectionRequest, TokenResponse } from '@/types/api'

/** 아이디/비밀번호 로그인. 성공 시 토큰을 저장한다. 실패 시 ApiError (423 = 계정 잠금). */
export async function login(loginId: string, password: string): Promise<TokenResponse> {
  const res = await apiFetch<TokenResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { loginId, password },
  })
  tokenStore.set(res.accessToken, res.refreshToken)
  return res
}

/** 로그아웃. refreshToken 을 서버에서 무효화하고 로컬 토큰을 지운다. */
export async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefresh()
  try {
    if (refreshToken) {
      await apiFetch('/api/auth/logout', { method: 'POST', auth: false, body: { refreshToken } })
    }
  } catch {
    /* 서버 실패해도 로컬 세션은 정리한다 */
  } finally {
    tokenStore.clear()
  }
}

/** 소셜 최초 로그인 후 회원 유형(구직자/시설) 확정. GUEST 토큰 필요. 새 토큰으로 교체된다. */
export async function selectSocialRole(req: SocialRoleSelectionRequest): Promise<TokenResponse> {
  const res = await apiFetch<TokenResponse>('/api/auth/social/select-role', {
    method: 'POST',
    body: req,
  })
  tokenStore.set(res.accessToken, res.refreshToken)
  return res
}
