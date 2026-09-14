import { Link2, LocateFixed, MapPin, MessageCircle, Share2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CustomOverlayMap, Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import { getJobPostingsInBounds } from '@/api/job-postings'
import heroBannerImage from '@/assets/hero-banner.png'
import { ScrapButton } from '@/components/common/scrap-button'
import { JobListItem } from '@/components/job/job-list-item'
import { useToast } from '@/components/ui/toast'
import { summaryToJob } from '@/lib/job-adapter'
import { applyFilters, type JobFilterState } from '@/lib/job-filters'
import { cn, formatDistanceKm, formatPay } from '@/lib/utils'
import type { Job } from '@/types'

interface MapMarkerItem {
  job: Job
  lat: number
  lng: number
  distanceKm: number
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
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
    libraries: ['services'],
  })
  const [rawMarkers, setRawMarkers] = useState<MapMarkerItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [tooMany, setTooMany] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const { toast } = useToast()

  /** 마커 팝업이 닫히거나 다른 공고로 바뀌면 공유 메뉴도 같이 닫는다. */
  useEffect(() => {
    setShareMenuOpen(false)
  }, [activeId])

  /** react-kakao-maps-sdk 의 `onCreate` 는 (마운트 시가 아니라) 콜백의 참조가 바뀔 때마다 다시
   * 호출된다 — refreshMarkers 를 매 렌더마다 새로 만들면 렌더 -> onCreate 재호출 -> setState ->
   * 렌더 -> ... 로 무한 루프(+무한 재조회)가 생긴다. center/radiusKm 은 ref 로 최신값만 읽어서
   * refreshMarkers 자체는 참조가 절대 바뀌지 않게 만든다. */
  const centerRef = useRef(center)
  centerRef.current = center
  const radiusKmRef = useRef(radiusKm)
  radiusKmRef.current = radiusKm

  /** 내 위치 좌표 -> 주소 텍스트(도로명 우선, 없으면 지번). 지도 아래에 사람이 읽을 수 있는
   * 형태로 보여주기 위한 역지오코딩 — 좌표만으로는 사용자가 위치를 가늠하기 어렵다. */
  useEffect(() => {
    if (loading || error) return
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.coord2Address(center.lng, center.lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        const { road_address, address: jibun } = result[0]
        setAddress(road_address?.address_name ?? jibun.address_name)
      }
    })
  }, [center.lat, center.lng, loading, error])

  /** 필터에 걸리는 마커는 원색 배지로 눈에 띄게, 나머지는 흐리게 — 지도에서 아예 없애지 않고
   * 위치 맥락은 남겨둔 채 "필터에 맞는 곳"만 두드러지게 한다. */
  const markers = useMemo(() => {
    const matchedIds = new Set(applyFilters(rawMarkers.map((m) => m.job), filters).map((job) => job.id))
    return rawMarkers.map((m) => ({ ...m, matched: matchedIds.has(m.job.id) }))
  }, [rawMarkers, filters])

  /** 내 위치와 가까운 순으로 — 리스트에서 위쪽부터 훑어보면 가까운 공고부터 보이게 한다. */
  const nearestFirst = useMemo(() => [...markers].sort((a, b) => a.distanceKm - b.distanceKm), [markers])

  const selectedJob = useMemo(
    () => markers.find((m) => m.job.id === selectedJobId)?.job ?? null,
    [markers, selectedJobId],
  )

  useEffect(() => {
    onJobsChange?.(rawMarkers.map((m) => m.job))
  }, [rawMarkers, onJobsChange])

  /** 카카오톡 공유 SDK — 지도/우편번호 SDK 와는 별도 스크립트(대문자 Kakao)라 따로 로드한다. */
  const [kakaoShareReady, setKakaoShareReady] = useState(false)
  useEffect(() => {
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
      setKakaoShareReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js'
    script.onload = () => {
      if (!Kakao.isInitialized()) Kakao.init(import.meta.env.VITE_KAKAO_MAP_KEY)
      setKakaoShareReady(true)
    }
    document.head.appendChild(script)
  }, [])

  const handleKakaoShare = (job: Job) => {
    if (!kakaoShareReady || typeof Kakao === 'undefined') {
      toast({ title: '카카오톡 공유를 준비 중이에요. 잠시 후 다시 시도해주세요.', variant: 'error' })
      return
    }
    const url = `${window.location.origin}/jobs/${job.id}`
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: job.facilityName,
        description: formatPay(job.payType, job.payAmount),
        imageUrl: `${window.location.origin}${heroBannerImage}`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: '상세보기', link: { mobileWebUrl: url, webUrl: url } }],
    })
  }

  /** 공고 상세 링크를 클립보드에 복사. */
  const handleCopyLink = async (job: Job) => {
    const url = `${window.location.origin}/jobs/${job.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: '링크가 복사되었습니다.', variant: 'success' })
    } catch {
      toast({ title: '링크 복사에 실패했습니다.', variant: 'error' })
    }
  }

  const refreshMarkers = useCallback((map: kakao.maps.Map) => {
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
        const { lat, lng } = centerRef.current
        const withinRadius = results
          .map((r) => ({ r, d: distanceKm(lat, lng, r.latitude, r.longitude) }))
          .filter(({ d }) => d <= radiusKmRef.current)
        setTooMany(withinRadius.length >= 200)
        setRawMarkers(
          withinRadius.map(({ r, d }) => ({
            job: summaryToJob(r.posting),
            lat: r.latitude,
            lng: r.longitude,
            distanceKm: d,
          })),
        )
      })
      .catch(() => setRawMarkers([]))
  }, [])

  const handleMapCreate = useCallback(
    (map: kakao.maps.Map) => {
      mapRef.current = map
      refreshMarkers(map)
    },
    [refreshMarkers],
  )

  /** 지도를 손으로 옮기거나 확대/축소한 뒤에도 버튼 한 번으로 내 위치 기준으로 되돌아온다. */
  const handleRecenter = () => {
    const map = mapRef.current
    if (!map) return
    map.setLevel(levelForRadiusKm(radiusKm))
    map.setCenter(new kakao.maps.LatLng(center.lat, center.lng))
  }

  /** 목록에서 공고를 고르면 지도가 그 위치로 이동하고, 아래에 상세 카드가 뜬다. */
  const handleSelectJob = (item: MapMarkerItem) => {
    setSelectedJobId((prev) => (prev === item.job.id ? null : item.job.id))
    mapRef.current?.panTo(new kakao.maps.LatLng(item.lat, item.lng))
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
    <div className={cn('flex flex-col', className)}>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-card border border-border">
        <Map
          key={radiusKm}
          center={center}
          level={levelForRadiusKm(radiusKm)}
          style={{ width: '100%', height: '100%' }}
          onCreate={handleMapCreate}
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
                      title="닫기"
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
                      <div className="relative">
                        <button
                          type="button"
                          aria-label="공유하기"
                          title="공유하기"
                          onClick={(event) => {
                            event.stopPropagation()
                            setShareMenuOpen((prev) => !prev)
                          }}
                          className="grid size-9 shrink-0 place-items-center rounded-btn border border-border bg-surface text-fg-subtle hover:border-border-strong hover:text-fg-muted"
                        >
                          <Share2 className="size-[18px]" aria-hidden />
                        </button>
                        {shareMenuOpen && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-card border border-border bg-surface shadow-overlay">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setShareMenuOpen(false)
                                handleKakaoShare(job)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-surface-sunken"
                            >
                              <MessageCircle
                                className="size-4 shrink-0 rounded-full bg-[#FEE500] p-0.5 text-[#3C1E1E]"
                                fill="currentColor"
                                aria-hidden
                              />
                              카카오톡 공유
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setShareMenuOpen(false)
                                handleCopyLink(job)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-surface-sunken"
                            >
                              <Link2 className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                              링크 복사
                            </button>
                          </div>
                        )}
                      </div>
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

        <button
          type="button"
          onClick={handleRecenter}
          aria-label="내 위치로 이동"
          title="내 위치로 이동"
          className="absolute bottom-3 right-3 z-[999] grid size-11 place-items-center rounded-full border border-border bg-surface text-fg-muted shadow-overlay hover:border-primary hover:text-primary-deep"
        >
          <LocateFixed className="size-5" aria-hidden />
        </button>
      </div>

      {/* 지도 아래 내 현재 위치 주소 + 주변 공고 목록. 핀을 정확히 찍기 어려운 터치 환경을
       * 고려해서, 목록에서 골라도 지도 이동 + 아래 상세 카드로 이어지게 한다. */}
      <div className="mt-2 rounded-card border border-border bg-surface px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-sm text-fg-muted">
          <span className="relative flex size-2.5 shrink-0 items-center justify-center">
            <span className="absolute inline-flex size-2.5 rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          <span className="truncate">
            {address ? (
              <>
                내 위치: <span className="font-medium text-fg">{address}</span>
              </>
            ) : (
              '내 위치 확인 중...'
            )}
          </span>
          {nearestFirst.length > 0 && (
            <span className="ml-auto shrink-0 text-fg-subtle">
              주변 채용공고 <span className="font-bold text-primary-deep">{nearestFirst.length}</span>건
            </span>
          )}
        </div>

        {nearestFirst.length > 0 && (
          <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {nearestFirst.map((item) => (
              <button
                key={item.job.id}
                type="button"
                onClick={() => handleSelectJob(item)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                  selectedJobId === item.job.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-fg-muted hover:border-primary/50 hover:text-primary-deep',
                )}
              >
                {item.job.facilityName} · {formatDistanceKm(item.distanceKm)}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="mt-2 overflow-hidden rounded-card border border-primary/40">
          <JobListItem job={selectedJob} showMatching={false} />
        </div>
      )}
    </div>
  )
}
