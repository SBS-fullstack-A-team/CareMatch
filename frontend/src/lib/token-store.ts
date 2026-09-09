/**
 * 액세스/리프레시 토큰 보관소.
 *
 * 저장 위치: localStorage (탭·재시작 넘어 유지). 각 브라우저에만 저장되고 서버·타인에게 전달되지 않음.
 * 트레이드오프는 XSS 노출 — 외부 스크립트를 붙이지 않는 전제.
 *
 * React 는 useSyncExternalStore 로 구독한다 (use-app.tsx).
 */

const ACCESS_KEY = 'carematch.accessToken'
const REFRESH_KEY = 'carematch.refreshToken'

type Listener = () => void
const listeners = new Set<Listener>()

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function emit() {
  listeners.forEach((fn) => fn())
}

export const tokenStore = {
  getAccess: () => safeGet(ACCESS_KEY),
  getRefresh: () => safeGet(REFRESH_KEY),
  hasSession: () => Boolean(safeGet(ACCESS_KEY)),

  set(accessToken: string, refreshToken: string) {
    try {
      localStorage.setItem(ACCESS_KEY, accessToken)
      localStorage.setItem(REFRESH_KEY, refreshToken)
    } catch {
      /* 사생활 보호 모드 등에서 저장 불가 — 무시 */
    }
    emit()
  },

  clear() {
    try {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      /* noop */
    }
    emit()
  },

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

// 다른 탭에서의 로그인/로그아웃을 이 탭에도 반영
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ACCESS_KEY || e.key === REFRESH_KEY || e.key === null) emit()
  })
}
