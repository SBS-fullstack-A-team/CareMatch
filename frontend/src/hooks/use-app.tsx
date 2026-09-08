import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type MemberType = 'personal' | 'facility'

export interface SessionUser {
  name: string
  memberType: MemberType
  /** 개인회원: 직종 / 시설회원: 시설명 */
  subtitle: string
  point: number
  unreadNotifications: number
}

export const FONT_SCALES = ['normal', 'large', 'xlarge'] as const
export type FontScale = (typeof FONT_SCALES)[number]

/** DESIGN_SYSTEM.md §25 — [기본] [크게] [더크게] */
export const FONT_SCALE_LABEL: Record<FontScale, string> = {
  normal: '기본',
  large: '크게',
  xlarge: '더크게',
}

interface AppContextValue {
  user: SessionUser | null
  login: (memberType?: MemberType) => void
  logout: () => void
  fontScale: FontScale
  setFontScale: (scale: FontScale) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const DEMO_USERS: Record<MemberType, SessionUser> = {
  personal: {
    name: '김영희',
    memberType: 'personal',
    subtitle: '요양보호사',
    point: 3200,
    unreadNotifications: 3,
  },
  facility: {
    name: '박정훈',
    memberType: 'facility',
    subtitle: '강남소망재가노인복지센터',
    point: 18500,
    unreadNotifications: 5,
  },
}

const FONT_SCALE_KEY = 'carematch.fontScale'

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(DEMO_USERS.personal)
  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    const stored = localStorage.getItem(FONT_SCALE_KEY) as FontScale | null
    return stored && FONT_SCALES.includes(stored) ? stored : 'normal'
  })

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale
    localStorage.setItem(FONT_SCALE_KEY, fontScale)
  }, [fontScale])

  const login = useCallback((memberType: MemberType = 'personal') => {
    setUser(DEMO_USERS[memberType])
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const value = useMemo<AppContextValue>(
    () => ({ user, login, logout, fontScale, setFontScale: setFontScaleState }),
    [user, login, logout, fontScale],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp은 AppProvider 내부에서만 사용할 수 있습니다.')
  return context
}
