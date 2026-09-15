import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { login as authLogin, logout as authLogout } from '@/api/auth'
import { getDisplayPreference, getMe, updateDisplayPreference } from '@/api/members'
import { getUnreadNotificationCount } from '@/api/notifications'
import { tokenStore } from '@/lib/token-store'
import type { FontScaleServer, MemberRole, MyPageResponse, TokenResponse } from '@/types/api'

export type MemberType = 'personal' | 'facility'

export interface SessionUser {
  name: string
  /** 포인트 충전 등 포트원 결제창의 구매자(customer) 정보로 쓰인다. */
  email: string
  memberType: MemberType
  /** 원본 역할. 라우트 가드 등 세밀한 권한 판정에 사용한다 (memberType 은 표시용). */
  role: MemberRole
  /** 시설회원의 관리자 승인 상태. 그 외 역할은 null. */
  facilityApprovalStatus: MyPageResponse['facilityApprovalStatus']
  /** 구직회원·보호자회원: 상태 / 시설회원: 승인 상태 문구 */
  subtitle: string
  point: number
  unreadNotifications: number
}

/**
 * 글자크기 10단계 (DESIGN_SYSTEM.md §25 — 버튼 클릭 → 모달 슬라이더).
 * 4단계(100%)가 기존 "기본"과 같은 크기. 단계당 10%p씩 70%~160%.
 */
export const FONT_SCALE_MIN = 1
export const FONT_SCALE_MAX = 10
export const FONT_SCALE_STEPS = Array.from(
  { length: FONT_SCALE_MAX },
  (_, i) => i + 1,
) as readonly number[]
export type FontScale = number
/** 4단계 = 100% — 기존 "기본" 크기와 동일 */
export const FONT_SCALE_DEFAULT: FontScale = 4

const FONT_SCALE_PERCENT: Record<FontScale, number> = {
  1: 70,
  2: 80,
  3: 90,
  4: 100,
  5: 110,
  6: 120,
  7: 130,
  8: 140,
  9: 150,
  10: 160,
}

export function fontScalePercent(scale: FontScale): number {
  return FONT_SCALE_PERCENT[scale] ?? 100
}

function clampFontScale(scale: number): FontScale {
  const rounded = Math.round(scale)
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, rounded))
}

interface AppContextValue {
  user: SessionUser | null
  /** 최초 세션 확인이 끝났는지 (라우트 가드 등에서 사용) */
  authReady: boolean
  /** 아이디/비밀번호 로그인. 실패 시 ApiError 를 던진다. */
  login: (loginId: string, password: string) => Promise<TokenResponse>
  logout: () => Promise<void>
  /** 서버에서 내 정보를 다시 불러와 세션(포인트 등)을 갱신한다. 예: 포인트 충전 완료 직후. */
  refreshUser: () => Promise<void>
  /** 안읽은 알림 개수만 다시 불러온다. 알림 화면에서 읽음 처리 직후 배지를 즉시 갱신할 때 사용. */
  refreshUnreadCount: () => Promise<void>
  fontScale: FontScale
  setFontScale: (scale: FontScale) => void
  easyMode: boolean
  setEasyMode: (value: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const FONT_SCALE_KEY = 'carematch.fontScale'
const EASY_MODE_KEY = 'carematch.easyMode'

/**
 * 서버는 아직 NORMAL/LARGE/XLARGE 3단계만 저장한다 — 10단계는 프론트 로컬(localStorage)
 * 기준이 정확한 값이고, 서버엔 가장 가까운 3단계로 근사해 동기화만 해 둔다.
 */
const toServerScale = (s: FontScale): FontScaleServer =>
  s <= FONT_SCALE_DEFAULT ? 'NORMAL' : s <= 7 ? 'LARGE' : 'XLARGE'
const fromServerScale = (s: FontScaleServer): FontScale =>
  s === 'XLARGE' ? 8 : s === 'LARGE' ? 6 : FONT_SCALE_DEFAULT

/** 이전 3단계('normal'|'large'|'xlarge') localStorage 값과의 하위호환 */
const LEGACY_SCALE: Record<string, FontScale> = {
  normal: FONT_SCALE_DEFAULT,
  large: 6,
  xlarge: 8,
}

function readStoredScale(): FontScale {
  try {
    const stored = localStorage.getItem(FONT_SCALE_KEY)
    if (!stored) return FONT_SCALE_DEFAULT
    if (stored in LEGACY_SCALE) return LEGACY_SCALE[stored]
    const parsed = Number(stored)
    return Number.isFinite(parsed) ? clampFontScale(parsed) : FONT_SCALE_DEFAULT
  } catch {
    return FONT_SCALE_DEFAULT
  }
}

function readStoredEasyMode(): boolean {
  try {
    return localStorage.getItem(EASY_MODE_KEY) === '1'
  } catch {
    return false
  }
}

function toSessionUser(me: MyPageResponse): SessionUser {
  const memberType: MemberType = me.role === 'FACILITY' ? 'facility' : 'personal'

  let subtitle: string
  if (me.role === 'FACILITY') {
    subtitle =
      me.facilityApprovalStatus === 'APPROVED'
        ? '시설회원'
        : me.facilityApprovalStatus === 'REJECTED'
          ? '시설회원 (승인 거절)'
          : '시설회원 (승인 대기)'
  } else if (me.role === 'ADMIN') {
    subtitle = '관리자'
  } else if (me.role === 'GENERAL') {
    subtitle = '보호자회원'
  } else {
    subtitle = me.employmentStatus === 'EMPLOYED' ? '재직 중' : '구직 중'
  }

  return {
    name: me.name,
    email: me.email,
    memberType,
    role: me.role,
    facilityApprovalStatus: me.facilityApprovalStatus,
    subtitle,
    point: me.point,
    // getMe() 응답엔 없음 — 세션 진입 직후 폴링 effect(fetchUnreadCount)가 곧바로 채운다.
    unreadNotifications: 0,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [fontScale, setFontScaleState] = useState<FontScale>(readStoredScale)
  const [easyMode, setEasyModeState] = useState<boolean>(readStoredEasyMode)

  const fontScaleRef = useRef(fontScale)
  const easyModeRef = useRef(easyMode)
  useEffect(() => {
    fontScaleRef.current = fontScale
  }, [fontScale])
  useEffect(() => {
    easyModeRef.current = easyMode
  }, [easyMode])

  // 토큰 상태에 맞춰 세션(+서버 표시설정) 동기화. 로그인/로그아웃/다른 탭 변경 시 재실행.
  useEffect(() => {
    let alive = true

    async function sync() {
      if (!tokenStore.hasSession()) {
        if (alive) {
          setUser(null)
          setAuthReady(true)
        }
        return
      }
      try {
        const me = await getMe()
        if (alive) setUser(toSessionUser(me))
      } catch {
        if (alive) setUser(null)
        return
      } finally {
        if (alive) setAuthReady(true)
      }
      try {
        const pref = await getDisplayPreference()
        if (alive) {
          setFontScaleState(fromServerScale(pref.fontScale))
          setEasyModeState(pref.easyMode)
        }
      } catch {
        /* 표시설정 조회 실패는 무시 — 로컬 저장값 유지 */
      }
    }

    void sync()
    return tokenStore.subscribe(() => void sync())
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    if (!tokenStore.hasSession()) return
    try {
      const { count } = await getUnreadNotificationCount()
      setUser((prev) => (prev ? { ...prev, unreadNotifications: count } : prev))
    } catch {
      /* 폴링 실패는 조용히 무시 — 다음 주기에 다시 시도 */
    }
  }, [])

  const refreshUnreadCount = useCallback(() => fetchUnreadCount(), [fetchUnreadCount])

  // 안읽은 알림 개수 폴링(30초 주기). 실시간 푸시가 없어 폴링으로 대체하는 MVP 수준.
  // user 객체 자체가 아니라 로그인 여부(hasUser)에만 의존 — 매 폴링마다 user 참조가
  // 바뀌는데 그걸 의존성에 넣으면 인터벌이 계속 재생성돼 사실상 쉬지 않고 도는 루프가 된다.
  const hasUser = Boolean(user)
  useEffect(() => {
    if (!hasUser) return
    void fetchUnreadCount()
    const id = setInterval(() => void fetchUnreadCount(), 30_000)
    return () => clearInterval(id)
  }, [hasUser, fetchUnreadCount])

  // 글자 크기: 루트 font-size(%) 반영 + localStorage
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScalePercent(fontScale)}%`
    document.documentElement.dataset.fontScale = String(fontScale)
    try {
      localStorage.setItem(FONT_SCALE_KEY, String(fontScale))
    } catch {
      /* noop */
    }
  }, [fontScale])

  // 쉬운 화면 모드: DOM 반영 + localStorage
  useEffect(() => {
    document.documentElement.dataset.easyMode = easyMode ? 'on' : 'off'
    try {
      localStorage.setItem(EASY_MODE_KEY, easyMode ? '1' : '0')
    } catch {
      /* noop */
    }
  }, [easyMode])

  const persistPref = useCallback((next: { fontScale: FontScale; easyMode: boolean }) => {
    if (!tokenStore.hasSession()) return
    void updateDisplayPreference({
      fontScale: toServerScale(next.fontScale),
      easyMode: next.easyMode,
    }).catch(() => {
      /* 서버 동기화 실패는 조용히 무시 — 로컬값은 이미 반영됨 */
    })
  }, [])

  const setFontScale = useCallback(
    (scale: FontScale) => {
      const clamped = clampFontScale(scale)
      setFontScaleState(clamped)
      persistPref({ fontScale: clamped, easyMode: easyModeRef.current })
    },
    [persistPref],
  )

  const setEasyMode = useCallback(
    (value: boolean) => {
      setEasyModeState(value)
      persistPref({ fontScale: fontScaleRef.current, easyMode: value })
    },
    [persistPref],
  )

  const login = useCallback((loginId: string, password: string) => {
    // 토큰 저장 → tokenStore 구독자(sync)가 user 를 채운다
    return authLogin(loginId, password)
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
  }, [])

  const refreshUser = useCallback(async () => {
    if (!tokenStore.hasSession()) return
    const me = await getMe()
    setUser(toSessionUser(me))
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authReady,
      login,
      logout,
      refreshUser,
      refreshUnreadCount,
      fontScale,
      setFontScale,
      easyMode,
      setEasyMode,
    }),
    [
      user,
      authReady,
      login,
      logout,
      refreshUser,
      refreshUnreadCount,
      fontScale,
      setFontScale,
      easyMode,
      setEasyMode,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp은 AppProvider 내부에서만 사용할 수 있습니다.')
  return context
}
