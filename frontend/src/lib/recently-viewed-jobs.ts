/**
 * "오늘 본 공고" — 백엔드 조회이력 없이 프론트(localStorage)만으로 오늘 하루 열어본
 * 공고를 기록한다. 공고 상세(JobDetail) 진입 시 recordJobView() 를 호출한다.
 */
const STORAGE_KEY = 'carematch.recentlyViewedJobs'
/** 넘치면 오래된 것부터 버린다 — "오늘"만 노출하므로 하루치가 이 개수를 넘는 극단적인 경우 대비. */
const MAX_ENTRIES = 30

interface ViewedEntry {
  jobId: number
  /** ISO datetime */
  viewedAt: string
}

function readAll(): ViewedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(entries: ViewedEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* noop — 시크릿 모드 등에서 저장 실패해도 화면은 그대로 동작해야 한다 */
  }
}

/** 공고 상세를 열 때 호출. 같은 공고를 다시 보면 맨 앞으로 갱신한다. */
export function recordJobView(jobId: number) {
  if (!Number.isFinite(jobId)) return
  const rest = readAll().filter((entry) => entry.jobId !== jobId)
  const next = [{ jobId, viewedAt: new Date().toISOString() }, ...rest].slice(0, MAX_ENTRIES)
  writeAll(next)
}

/** 오늘(로컬 날짜 기준) 열어본 공고 id 목록. 최근 순. */
export function getTodayViewedJobIds(): number[] {
  const todayKey = new Date().toDateString()
  return readAll()
    .filter((entry) => new Date(entry.viewedAt).toDateString() === todayKey)
    .map((entry) => entry.jobId)
}
