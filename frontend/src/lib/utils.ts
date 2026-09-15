import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 1350000 -> "1,350,000" */
export function formatNumber(value: number) {
  return value.toLocaleString('ko-KR')
}

/** 0.5 -> "500m", 1 -> "1km", 10 -> "10km" — 반경/거리 표기 공통 규칙 (내 주변 일자리) */
export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km}km`
}

/**
 * 급여 표기를 서비스 전역에서 동일한 규칙으로 만든다.
 * ex) { type: 'hourly', amount: 13500 } -> "시급 13,500원"
 */
export type PayType = 'hourly' | 'daily' | 'monthly' | 'annual' | 'negotiable'

const PAY_TYPE_LABEL: Record<PayType, string> = {
  hourly: '시급',
  daily: '일급',
  monthly: '월급',
  annual: '연봉',
  negotiable: '급여',
}

export function formatPay(type: PayType, amount?: number) {
  if (type === 'negotiable' || amount === undefined) return '급여 협의'
  return `${PAY_TYPE_LABEL[type]} ${formatNumber(amount)}원`
}

/** "2025-08-25" -> "2025.08.25" (등록일·갱신일 표기) */
export function formatDotDate(iso: string) {
  return iso.replaceAll('-', '.')
}

/** "2025-08-25" -> "08.25" */
export function formatShortDate(iso: string) {
  return formatDotDate(iso).slice(5)
}

/** 등록일 기준 상대 시간 ("오늘", "3일 전") — 목록 화면에서 사용 */
export function formatRelativeDay(iso: string, today = new Date()) {
  const target = new Date(iso)
  const diff = Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())) /
      86_400_000,
  )
  if (diff <= 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff < 7) return `${diff}일 전`
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`
  return `${Math.floor(diff / 30)}개월 전`
}

/** 마감일까지 남은 일수 */
export function daysUntil(iso: string, today = new Date()) {
  const target = new Date(iso)
  return Math.ceil(
    (Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  )
}

/**
 * 개인정보 마스킹 (DESIGN_SYSTEM.md §21)
 * "김정회" -> "김정○" / "김이" -> "김○"
 */
export function maskName(name: string) {
  if (name.length <= 1) return name
  return `${name.slice(0, -1)}○`
}

/**
 * 휴대폰 번호 입력에 하이픈을 자동으로 넣는다 — "01012345678" -> "010-1234-5678".
 * 숫자만 남겨 11자리까지 받고, 010 계열은 3-4-4, 그 외 10자리 번호(011 등)는 3-3-4 로 끊는다.
 * 백엔드 가입 DTO 는 하이픈 유무를 모두 허용하고(`^01[0-9]-?\d{3,4}-?\d{4}$`),
 * 인증 API 는 숫자만 남겨 비교하므로 하이픈이 붙은 값을 그대로 보내도 된다.
 */
export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits

  // 010 으로 시작하면 항상 3-4-4. 그 외는 10자리까지 3-3-4 로 보고, 11자리면 3-4-4.
  const middleEnd = !digits.startsWith('010') && digits.length <= 10 ? 6 : 7
  if (digits.length <= middleEnd) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, middleEnd)}-${digits.slice(middleEnd)}`
}

/** 어르신 정보 한 줄 요약 — "4등급 · 여 · 보행 가능" */
export function formatElderlySummary(elderly: {
  grade: string
  gender: string
  mobility: string
}) {
  return `${elderly.grade} · ${elderly.gender} · ${elderly.mobility}`
}
