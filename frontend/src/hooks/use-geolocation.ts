import { useCallback, useState } from 'react'

export type GeolocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' | 'error'

interface UseGeolocationResult {
  status: GeolocationStatus
  coords: { lat: number; lng: number } | null
  /** 위치 권한을 다시 요청한다 (거부 후 "다시 시도" 버튼 등에서 사용). */
  request: () => void
}

/**
 * 브라우저 Geolocation API 래퍼. "내 주변 일자리"처럼 사용자 현재 위치가 필요한
 * 화면에서 GPS 권한 요청 → 좌표 획득까지의 상태(loading/거부/미지원/에러)를 관리한다.
 */
export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setStatus('granted')
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }, [])

  return { status, coords, request }
}
