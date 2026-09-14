import { MapPin, Share2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CustomOverlayMap, Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import { getJobPostingsInBounds } from '@/api/job-postings'
import { ScrapButton } from '@/components/common/scrap-button'
import { useToast } from '@/components/ui/toast'
import { summaryToJob } from '@/lib/job-adapter'
import { applyFilters, type JobFilterState } from '@/lib/job-filters'
import { cn, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

interface MapMarkerItem {
  job: Job
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

/** 두 좌표 간 대원 거리(km). 백엔드 JobPostingService.distanceKm 과 동일한 공식. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * 반경(km)에 맞는 카카오맵 확대 레벨(1=가장 확대). 카카오맵 레벨별 축척 표시가
 * 레벨 4=100m, 5=250m, 6=500m, 7=1km 라서 그대로 맞춘다(레벨 3=50m 는 안 씀).
 */
function levelForRadiusKm(radiusKm: number): number {
  if (radiusKm <= 0.1) return 4
  if (radiusKm <= 0.25) return 5
  if (radiusKm <= 0.5) return 6
  return 7
}

/**
 * "내 주변 일자리" 지도 뷰. 반경 선택에 맞춰 초기 확대 수준을 잡고, 기준 좌표(내 위치)로부터
 * 그 반경 안의 마커만 보여준다 — 리스트 뷰와 동일한 기준(반경 필터)을 지도에도 그대로 적용한다.
 * 좌측 필터 패널(`filters`)도 리스트와 같은 규칙(`applyFilters`)으로 마커에 적용한다 — 원본
 * 마커는 그대로 두고 필터링은 클라이언트에서 계산해서, 필터만 바꿨을 땐 재조회 없이 즉시 반영된다.
 * 지도를 움직이면(onIdle) 뷰포트 기준으로 마커를 다시 불러오되, 반경 필터는 계속 유지한다.
 * 반경을 바꾸면 지도를 그 반경 기준으로 다시 그린다(key=radiusKm).
 */
export function NearbyMap({
  center,
  radiusKm,
  filters,
  onJobsChange,
  className,
}: {
  center: { lat: number; lng: number }
  radiusKm: number
  filters: JobFilterState
  /** 지도에 지금 떠 있는(반경 안) 원본 공고 목록이 바뀔 때마다 알려준다 — 좌측 필터 패널의
   * 건수 배지를 지도 기준으로 정확히 맞추기 위해 상위(NearbyJobsPage)로 끌어올린다. */
  onJobsChange?: (jobs: Job[]) => void
  className?: string
}) {
  const [loading, error] = useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY })
  const [rawMarkers, setRawMarkers] = useState<MapMarkerItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tooMany, setTooMany] = useState(false)
  const { toast } = useToast()

  /** 필터에 걸리는 마커는 원색 배지로 눈에 띄게, 나머지는 흐리게 — 지도에서 아예 없애지 않고
   * 위치 맥락은 남겨둔 채 "필터에 맞는 곳"만 두드러지게 한다. */
  const markers = useMemo(() => {
    const matchedIds = new Set(applyFilters(rawMarkers.map((m) => m.job), filters).map((job) => job.id))
    return rawMarkers.map((m) => ({ ...m, matched: matchedIds.has(m.job.id) }))
  }, [rawMarkers, filters])

  useEffect(() => {
    onJobsChange?.(rawMarkers.map((m) => m.job))
  }, [rawMarkers, onJobsChange])

  /** 공고 상세 링크를 공유. Web Share API 지원 브라우저는 공유 시트, 아니면 링크를 클립보드에 복사. */
  const handleShare = async (job: Job) => {
    const url = `${window.location.origin}/jobs/${job.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, url })
      } catch {
        // 사용자가 공유를 취소한 경우 — 별도 처리 없음
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: '링크가 복사되었습니다.', variant: 'success' })
    } catch {
      toast({ title: '링크 복사에 실패했습니다.', variant: 'error' })
    }
  }

  const refreshMarkers = (map: kakao.maps.Map) => {
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    getJobPostingsInBounds({
      swLat: sw.getLat(),
      swLng: sw.getLng(),
      neLat: ne.getLat(),
      neLng: ne.getLng(),
    })
      .then((results) => {
        const withinRadius = results.filter(
          (r) => distanceKm(center.lat, center.lng, r.latitude, r.longitude) <= radiusKm,
        )
        setTooMany(withinRadius.length >= 200)
        setRawMarkers(withinRadius.map((r) => ({ job: summaryToJob(r.posting), lat: r.latitude, lng: r.longitude })))
      })
      .catch(() => setRawMarkers([]))
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex h-full items-center justify-center rounded-card border border-border bg-surface p-6 text-center text-base text-fg-muted">
          지도를 불러오지 못했습니다. 카카오맵 API 키(VITE_KAKAO_MAP_KEY) 설정을 확인해 주세요.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="flex h-full items-center justify-center rounded-card border border-border bg-surface p-6 text-base text-fg-muted">
          지도를 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative h-full overflow-hidden rounded-card border border-border">
        <Map
          key={radiusKm}
          center={center}
          level={levelForRadiusKm(radiusKm)}
          style={{ width: '100%', height: '100%' }}
          onCreate={refreshMarkers}
          onIdle={refreshMarkers}
          onClick={() => setActiveId(null)}
        >
          {/* 내 위치 — 점 + 펄스 링(accent 색). zIndex 를 공고 핀(10~30)보다 낮춰서,
           * 좌표가 겹쳐도 공고 이름/핀이 항상 내 위치 점 위로 보이게 한다. */}
          <CustomOverlayMap position={center} zIndex={1}>
            <span className="relative flex size-7 items-center justify-center">
              <span className="absolute inline-flex size-7 animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-5 rounded-full border-2 border-white bg-accent shadow" />
            </span>
          </CustomOverlayMap>

          {markers.map(({ job, lat, lng, matched }) => (
            <CustomOverlayMap key={job.id} position={{ lat, lng }} yAnchor={1} clickable zIndex={matched ? 30 : 10}>
              {/* 팝업은 absolute 로 띄운다 — flow 안에 넣으면 열고 닫을 때 이 박스의 높이가
               * 바뀌어서, yAnchor(바닥 기준 좌표 고정)가 팝업 높이만큼 매번 다시 계산돼 핀이
               * 튀어 보인다. absolute 로 빼면 이 박스 높이는 핀 하나로 항상 고정된다. */}
              <div className="relative flex flex-col items-center">
                {activeId === job.id && (
                  <div className="absolute bottom-full left-1/2 mb-1 min-w-[200px] -translate-x-1/2 rounded-card border border-border bg-surface p-2.5 text-sm shadow-overlay">
                    <button
                      type="button"
                      aria-label="닫기"
                      onClick={(event) => {
                        event.stopPropagation()
                        setActiveId(null)
                      }}
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full text-fg-subtle hover:bg-surface-sunken hover:text-fg"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                    <p className="pr-8 font-bold text-fg">{job.facilityName}</p>
                    <p className="mt-0.5 text-fg-muted">{formatPay(job.payType, job.payAmount)}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Link
                        to={`/jobs/${job.id}`}
                        className={cn(
                          'inline-flex h-9 flex-1 items-center justify-center rounded-btn border border-primary/40',
                          'bg-surface px-3 text-sm font-semibold text-primary-deep hover:bg-primary-light',
                        )}
                      >
                        상세보기
                      </Link>
                      <ScrapButton jobId={Number(job.id)} defaultScrapped={job.scrapped} size="sm" />
                      <button
                        type="button"
                        aria-label="공유하기"
                        onClick={() => handleShare(job)}
                        className="grid size-9 shrink-0 place-items-center rounded-btn border border-border bg-surface text-fg-subtle hover:border-border-strong hover:text-fg-muted"
                      >
                        <Share2 className="size-[18px]" aria-hidden />
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setActiveId((prev) => (prev === job.id ? null : job.id))}
                  className={cn('flex flex-col items-center transition-all', !matched && 'scale-90 opacity-40')}
                >
                  <span
                    className={cn(
                      'mb-0.5 max-w-[130px] truncate rounded-full px-2 py-0.5 text-xs font-bold text-white shadow',
                      matched ? 'bg-primary' : 'bg-fg-subtle',
                    )}
                  >
                    {job.facilityName}
                  </span>
                  <MapPin
                    className={cn('size-8 drop-shadow-md', matched ? 'text-primary' : 'text-fg-subtle')}
                    fill="currentColor"
                    stroke="white"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>
              </div>
            </CustomOverlayMap>
          ))}
        </Map>

        {tooMany && (
          <p className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-fg/80 px-3 py-1.5 text-sm text-white">
            공고가 많아 일부만 표시돼요. 반경을 좁혀보세요.
          </p>
        )}
      </div>
    </div>
  )
}
