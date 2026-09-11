import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/lib/api-client'

interface UseAsyncResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** 실패 후 재시도, 또는 변이(취소/해제 등) 후 목록 새로고침 */
  reload: () => void
}

/**
 * 고객센터 화면들(`NoticeList` 등)이 반복하던 data/loading/error 트리플을 감싼 훅.
 * `deps` 가 바뀌면 자동 재요청한다. `fn` 은 매 렌더 새 클로저라도 상관없다 —
 * 실제 재요청 트리거는 `deps` 뿐이라 `fn` 자체는 의존성 배열에 넣지 않는다(ref 로 최신값만 사용).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): UseAsyncResult<T> {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((prev) => prev + 1), [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fnRef
      .current()
      .then((result) => {
        if (alive) setData(result)
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, reload }
}
