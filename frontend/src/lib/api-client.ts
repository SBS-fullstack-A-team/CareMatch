/**
 * 백엔드 API 호출 공통 래퍼.
 *
 * - baseURL: import.meta.env.VITE_API_BASE_URL
 * - JSON 직렬화/역직렬화
 * - 로그인 상태면 Authorization: Bearer <accessToken> 자동 첨부
 * - 401 → refreshToken 으로 재발급(/api/auth/reissue) 1회 시도 후 재요청.
 *   재발급 실패하면 토큰을 비우고 ApiError(401) 를 던진다 (호출부에서 로그인 화면으로).
 * - 실패 응답은 ApiError 로 통일 (백엔드 ErrorResponse: code/message/fieldErrors)
 */
import { tokenStore } from './token-store'
import type { ApiErrorBody } from '@/types/api'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/** 백엔드 오리진. 소셜 로그인처럼 fetch 가 아니라 전체 페이지 이동이 필요할 때 사용. */
export const API_BASE_URL = BASE_URL

export class ApiError extends Error {
  /** HTTP 상태. 네트워크 오류 등 응답 자체가 없으면 0 */
  readonly status: number
  /** 백엔드 에러 코드 (예: MEMBER_002). 없으면 'UNKNOWN' */
  readonly code: string
  readonly fieldErrors: { field: string; reason: string }[]

  constructor(status: number, body: Partial<ApiErrorBody> | null, fallbackMessage?: string) {
    super(body?.message || fallbackMessage || `요청에 실패했습니다 (HTTP ${status}).`)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.code ?? 'UNKNOWN'
    this.fieldErrors = body?.fieldErrors ?? []
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** 객체를 넘기면 JSON 으로 직렬화. FormData 등이 필요하면 rest 로 직접 전달 */
  body?: unknown
  /** false 면 Authorization 헤더를 붙이지 않는다 (로그인·회원가입 등 공개 API). 기본 true */
  auth?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

/** refreshToken 으로 accessToken 재발급. 동시에 여러 401 이 나도 한 번만 호출된다. */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return false

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE_URL}/api/auth/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data = (await res.json()) as { accessToken: string; refreshToken: string }
        tokenStore.set(data.accessToken, data.refreshToken)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

async function request<T>(path: string, options: ApiOptions, retried: boolean): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, {
      code: 'NO_BASE_URL',
      message: 'VITE_API_BASE_URL 이 설정되지 않았습니다. frontend/.env.local 을 확인하세요.',
    })
  }

  const { body, auth = true, headers, ...rest } = options
  const finalHeaders = new Headers(headers)
  if (body !== undefined && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  const accessToken = tokenStore.getAccess()
  if (auth && accessToken) finalHeaders.set('Authorization', `Bearer ${accessToken}`)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, null, '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.')
  }

  if (res.status === 401 && auth && !retried) {
    const ok = await refreshAccessToken()
    if (ok) return request<T>(path, options, true)
    tokenStore.clear()
  }

  if (res.status === 204 || res.headers.get('Content-Length') === '0') {
    return undefined as T
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!res.ok) throw new ApiError(res.status, null)
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data as Partial<ApiErrorBody> | null)
  }
  return data as T
}

export function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  return request<T>(path, options, false)
}
