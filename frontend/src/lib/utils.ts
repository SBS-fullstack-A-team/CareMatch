import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 1350000 -> "1,350,000" */
export function formatNumber(value: number) {
  return value.toLocaleString('ko-KR')
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

/** 어르신 정보 한 줄 요약 — "4등급 · 여 · 보행 가능" */
export function formatElderlySummary(elderly: {
  grade: string
  gender: string
  mobility: string
}) {
  return `${elderly.grade} · ${elderly.gender} · ${elderly.mobility}`
}
