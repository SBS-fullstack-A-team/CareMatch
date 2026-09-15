import { Link2, LocateFixed, MapPin, MessageCircle, Move, Share2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Circle, CustomOverlayMap, Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import { getJobPostingsInBounds } from '@/api/job-postings'
import heroBannerImage from '@/assets/hero-banner.png'
import { ScrapButton } from '@/components/common/scrap-button'
import { JobBadge } from '@/components/job/job-badge'
import { JobListItem } from '@/components/job/job-list-item'
import { useToast } from '@/components/ui/toast'
import { sortByPromotion, summaryToJob } from '@/lib/job-adapter'
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

const KM_PER_LAT_DEGREE = 111.32

/** 위경도 오차를 위도 `center.lat` 부근에서 (동서 km, 남북 km) 평면 오차로 근사 변환한다.
 * 반경 조절 핸들 드래그처럼 수 km 이내의 짧은 거리만 다루므로 평면 근사로 충분하다. */
function localOffsetKm(center: { lat: number; lng: number }, point: { lat: number; lng: number }) {
  const dLat = (point.lat - center.lat) * KM_PER_LAT_DEGREE
  const dLng = (point.lng - center.lng) * KM_PER_LAT_DEGREE * Math.cos((center.lat * Math.PI) / 180)
  return { dLat, dLng }
}

/** localOffsetKm 의 역변환 — (동서 km, 남북 km) 오차 -> 위경도. */
function pointFromOffsetKm(center: { lat: number; lng: number }, dLat: number, dLng: number) {
  return {
    lat: center.lat + dLat / KM_PER_LAT_DEGREE,
    lng: center.lng + dLng / (KM_PER_LAT_DEGREE * Math.cos((center.lat * Math.PI) / 180)),
  }
}

/**
 * 반경(km)에 맞는 카카오맵 확대 레벨(1=가장 확대). 카카오맵 레벨별 축척 표시가
 * 레벨 5=250m, 6=500m, 7=1km, 8=2km, 9=4km 라서 그대로 맞춘다(레벨 4=100m 이하는 안 씀) —
 * 반경 원(지름은 반경의 2배)이 화면 안에 다 들어오도록 반경보다 한 단계 넉넉한 레벨을 쓴다.
 */
function levelForRadiusKm(radiusKm: number): number {
  if (radiusKm <= 0.25) return 5
  if (radiusKm <= 0.5) return 6
  if (radiusKm <= 1) return 7
  if (radiusKm <= 2) return 8
  return 9
}

type MapMarkerWithMatch = MapMarkerItem & { matched: boolean }

interface MarkerCluster {
  lat: number
  lng: number
  items: MapMarkerWithMatch[]
}

/** 클러스터링 시 하나로 묶을 최대 픽셀 반경 — 이 안에 있는 마커는 확대하기 전까진 낱개 핀 대신
 * "N건" 배지 하나로 뭉쳐서 "대략 이 근처에 몇 건 있는지"만 보여준다. */
const CLUSTER_PIXEL_RADIUS = 48

/** 반경 원 핸들을 드래그로 조절할 수 있는 범위 — 프리셋 버튼(250m~3km)보다 살짝 더 넓게 잡아서
 * 버튼으로는 못 고르는 값도 세밀하게 고를 수 있게 한다. */
const MIN_DRAG_RADIUS_KM = 0.1
const MAX_DRAG_RADIUS_KM = 5

/** "반경 직접 조절" 버튼을 처음 켤 때만 사용법 토스트를 보여주기 위한 localStorage 키 —
 * 매번 뜨면 거슬리니 브라우저당 한 번만 띄운다. */
const RADIUS_ADJUST_HINT_STORAGE_KEY = 'carematch:nearby-radius-adjust-hint-shown'

/** 위도 `lat` 부근에서 카카오맵 투영 기준 1px 가 몇 m 인지. 확대 레벨/위도에만 좌우되고 지도를
 * 어디로 드래그했는지(중심 이동)와는 무관해서, 패닝 중에는 다시 계산할 필요가 없다. */
function metersPerPixelAt(map: kakao.maps.Map, lat: number): number {
  const projection = map.getProjection()
  const lngA = 127
  const lngB = 127.01
  const pointA = projection.containerPointFromCoords(new kakao.maps.LatLng(lat, lngA))
  const pointB = projection.containerPointFromCoords(new kakao.maps.LatLng(lat, lngB))
  const pixelDistance = Math.abs(pointB.x - pointA.x)
  if (pixelDistance === 0) return 0
  return (distanceKm(lat, lngA, lat, lngB) * 1000) / pixelDistance
}

/** 마커를 현재 확대 레벨 기준 픽셀 거리로 묶는다 — 정교한 클러스터링(격자/쿼드트리)까진 필요
 * 없고 "대략 몇 건" 정도만 보여주면 되므로, 단순 그리디 방식(반경 안의 첫 클러스터에 합류,
 * 없으면 새 클러스터 시작)으로 충분하다. */
function clusterMarkers(items: MapMarkerWithMatch[], thresholdKm: number): MarkerCluster[] {
  const clusters: MarkerCluster[] = []
  for (const item of items) {
    const target =
      thresholdKm > 0 ? clusters.find((c) => distanceKm(c.lat, c.lng, item.lat, item.lng) <= thresholdKm) : undefined
    if (target) {
      target.items.push(item)
      target.lat = target.items.reduce((sum, i) => sum + i.lat, 0) / target.items.length
      target.lng = target.items.reduce((sum, i) => sum + i.lng, 0) / target.items.length
    } else {
      clusters.push({ lat: item.lat, lng: item.lng, items: [item] })
    }
  }
  return clusters
}

/**
 * "내 주변 일자리" 지도 뷰. 반경 선택에 맞춰 초기 확대 수준을 잡고, 기준 좌표(내 위치)로부터
 * 그 반경 안의 마커만 보여준다 — 리스트 뷰와 동일한 기준(반경 필터)을 지도에도 그대로 적용한다.
 * 좌측 필터 패널(`filters`)도 리스트와 같은 규칙(`applyFilters`)으로 마커에 적용한다 — 원본
 * 마커는 그대로 두고 필터링은 클라이언트에서 계산해서, 필터만 바꿨을 땐 재조회 없이 즉시 반영된다.
 * 지도를 드래그하는 동안 "내 위치" 점과 반경 원은 화면 중심을 실시간으로 따라가고(요양나라
 * "내 주변 채용정보" 지도 참고), 움직임이 멈추면(onIdle) 그 중심 기준으로 마커/주소를 다시
 * 불러온다 — 반경 필터는 계속 유지한다. 반경(중심/확대 레벨도 마찬가지)은 `Map`/`Circle`
 * 컴포넌트가 prop 변화에 반응해 알아서 갱신하므로 리마운트가 필요 없다 — 그래서 반경 원 가장자리
 * 핸들을 드래그해서 실시간으로 반경을 조절해도(onRadiusChange) 지도가 깜빡이거나 원래 위치로
 * 튕기지 않는다.
 */
export function NearbyMap({
  center,
  radiusKm,
  filters,
  onJobsChange,
  onRadiusChange,
  className,
}: {
  center: { lat: number; lng: number }
  radiusKm: number
  filters: JobFilterState
  /** 지도에 지금 떠 있는(반경 안) 원본 공고 목록이 바뀔 때마다 알려준다 — 좌측 필터 패널의
   * 건수 배지를 지도 기준으로 정확히 맞추기 위해 상위(NearbyJobsPage)로 끌어올린다. */
  onJobsChange?: (jobs: Job[]) => void
  /** 반경 원 핸들을 드래그해서 조절을 마쳤을 때(놓았을 때) 새 반경(km)을 알려준다 — 프리셋
   * 버튼과 같은 자리(상위의 radiusKm state)를 갱신하도록 상위로 끌어올린다. 안 넘기면 핸들
   * 자체를 렌더링하지 않는다. */
  onRadiusChange?: (radiusKm: number) => void
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

  /** 지도 중심(내 위치 점 + 반경 원이 따라가는 좌표) — 실제 GPS/검색 위치(`center`)와 별개로,
   * 지도를 드래그하는 동안 실시간으로 갱신된다(요양나라 "내 주변 채용정보" 지도 참고: 지도를
   * 움직이면 중심 핀이 화면 가운데를 계속 따라간다). radiusKm 변경 시 지도 자체가
   * key={radiusKm} 로 재마운트되면서 이 state 도 `center` 기준으로 다시 초기화된다. */
  const [viewCenter, setViewCenter] = useState(center)

  /** 현재 확대 레벨 — 마커 클러스터링 기준(픽셀 거리 -> km 환산)에 쓰인다. 사용자가 마우스
   * 휠/핀치로 직접 확대·축소해도(반경 변경과 별개로) 클러스터가 그에 맞춰 다시 계산된다. */
  const [zoomLevel, setZoomLevel] = useState(() => levelForRadiusKm(radiusKm))
  const handleZoomChanged = useCallback((map: kakao.maps.Map) => {
    setZoomLevel(map.getLevel())
  }, [])

  /** react-kakao-maps-sdk 의 `onCreate` 는 (마운트 시가 아니라) 콜백의 참조가 바뀔 때마다 다시
   * 호출된다 — refreshMarkers 를 매 렌더마다 새로 만들면 렌더 -> onCreate 재호출 -> setState ->
   * 렌더 -> ... 로 무한 루프(+무한 재조회)가 생긴다. viewCenter/radiusKm 은 ref 로 최신값만
   * 읽어서 refreshMarkers 자체는 참조가 절대 바뀌지 않게 만든다. */
  const viewCenterRef = useRef(viewCenter)
  viewCenterRef.current = viewCenter
  const radiusKmRef = useRef(radiusKm)
  radiusKmRef.current = radiusKm
  const onRadiusChangeRef = useRef(onRadiusChange)
  onRadiusChangeRef.current = onRadiusChange

  /** 반경 원 가장자리의 드래그 핸들 — km(반경 값)과 중심 기준 (동서/남북) 오프셋을 함께 들고
   * 있는다. 드래그하지 않을 땐 핸들을 정동쪽에 두고, 드래그하는 동안엔 커서를 따라가면서
   * 커서 방향으로 반경을 늘리거나 줄인다(MIN/MAX_DRAG_RADIUS_KM 로 clamp). `radiusKm` prop 이
   * 바뀌면(프리셋 버튼 클릭 등) 정동쪽 기준으로 다시 초기화된다. */
  const [radiusHandle, setRadiusHandle] = useState(() => ({ km: radiusKm, dLat: 0, dLng: radiusKm }))
  useEffect(() => {
    setRadiusHandle({ km: radiusKm, dLat: 0, dLng: radiusKm })
  }, [radiusKm])

  /** 반경 조절 핸들은 기본으로는 숨겨두고(항상 떠 있으면 지도가 복잡해 보여서), 버튼을 눌러야
   * 나타난다. */
  const [radiusAdjustOpen, setRadiusAdjustOpen] = useState(false)

  /** 버튼을 처음 켤 때만(브라우저당 1회) 드래그 사용법을 토스트로 안내 — 아이콘 버튼 하나만으로는
   * 뭘 하는 건지, 특히 hover 툴팁이 안 뜨는 모바일에서는 알기 어렵다. */
  const handleToggleRadiusAdjust = () => {
    setRadiusAdjustOpen((prev) => {
      const next = !prev
      if (next && !window.localStorage.getItem(RADIUS_ADJUST_HINT_STORAGE_KEY)) {
        toast({ title: '초록 핀을 드래그해서 반경을 조절해보세요.', variant: 'info' })
        window.localStorage.setItem(RADIUS_ADJUST_HINT_STORAGE_KEY, '1')
      }
      return next
    })
  }

  /** 지도 중심이 바뀔 때마다(드래그 도중 포함, 애니메이션 프레임 단위로) 실시간 발생 — 위치
   * 갱신 자체는 좌표 계산만 하는 가벼운 작업이라 매 프레임 반영해도 된다. 네트워크 호출이 필요한
   * 주소 조회/마커 재조회는 onIdle(움직임이 멈췄을 때)에서만 한다. */
  const handleCenterChanged = useCallback((map: kakao.maps.Map) => {
    const c = map.getCenter()
    setViewCenter({ lat: c.getLat(), lng: c.getLng() })
  }, [])

  /** 좌표 -> 주소 텍스트(도로명 우선, 없으면 지번) 역지오코딩. 지도 아래에 사람이 읽을 수 있는
   * 형태로 보여주기 위함 — 좌표만으로는 사용자가 위치를 가늠하기 어렵다. */
  const lookupAddress = useCallback((lat: number, lng: number) => {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        const { road_address, address: jibun } = result[0]
        setAddress(road_address?.address_name ?? jibun.address_name)
      }
    })
  }, [])

  /** 최초 진입 + 실제 GPS/주소검색 위치가 바뀔 때(지도 드래그로 인한 변경은 제외 — 그건
   * onIdle 에서 처리)의 주소 표시. */
  useEffect(() => {
    if (loading || error) return
    lookupAddress(center.lat, center.lng)
  }, [center.lat, center.lng, loading, error, lookupAddress])

  /** 필터에 걸리는 마커는 원색 배지로 눈에 띄게, 나머지는 흐리게 — 지도에서 아예 없애지 않고
   * 위치 맥락은 남겨둔 채 "필터에 맞는 곳"만 두드러지게 한다. */
  const markers = useMemo((): MapMarkerWithMatch[] => {
    const matchedIds = new Set(applyFilters(rawMarkers.map((m) => m.job), filters).map((job) => job.id))
    return rawMarkers.map((m) => ({ ...m, matched: matchedIds.has(m.job.id) }))
  }, [rawMarkers, filters])

  /** 확대 레벨이 바뀌거나 마커 목록 자체가 바뀔 때만 다시 묶는다 — 드래그로 중심만 바뀔 때는
   * 마커 간 상대 거리(픽셀 기준)가 그대로라 다시 계산할 필요가 없다. */
  const clusters = useMemo(() => {
    const map = mapRef.current
    const thresholdKm = map ? (metersPerPixelAt(map, center.lat) * CLUSTER_PIXEL_RADIUS) / 1000 : 0
    return clusterMarkers(markers, thresholdKm)
  }, [markers, zoomLevel, center.lat])

  /** 내 위치와 가까운 순으로 — 리스트에서 위쪽부터 훑어보면 가까운 공고부터 보이게 한다. */
  const nearestFirst = useMemo(
    () => sortByPromotion([...markers].sort((a, b) => a.distanceKm - b.distanceKm), (item) => item.job.status),
    [markers],
  )

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

  const refreshMarkers = useCallback((map: kakao.maps.Map, radiusOverrideKm?: number) => {
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
        const { lat, lng } = viewCenterRef.current
        const radius = radiusOverrideKm ?? radiusKmRef.current
        const withinRadius = results
          .map((r) => ({ r, d: distanceKm(lat, lng, r.latitude, r.longitude) }))
          .filter(({ d }) => d <= radius)
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
      setZoomLevel(map.getLevel())
      refreshMarkers(map)
    },
    [refreshMarkers],
  )

  /** 클러스터 배지를 클릭하면 그 지점을 기준으로 두 단계 확대 — 낱개 핀이 보일 때까지
   * 반복해서 눌러 들어갈 수 있다. */
  const handleClusterClick = useCallback((cluster: MarkerCluster) => {
    const map = mapRef.current
    if (!map) return
    map.setLevel(Math.max(map.getLevel() - 2, 1), {
      anchor: new kakao.maps.LatLng(cluster.lat, cluster.lng),
      animate: true,
    })
  }, [])

  /** 반경 원 핸들 드래그 시작 — pointer capture 로 핸들 엘리먼트 자체에 이동/해제를 묶어서
   * (마우스/터치 공용) document 레벨 리스너 없이 처리한다. 드래그 중엔 좌표 계산만 하는 가벼운
   * 시각 반영만 하고, 실제 검색 반경(radiusKm)과 마커 재조회는 손을 뗀 순간에만 반영한다. */
  const handleRadiusHandlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const map = mapRef.current
    if (!map) return
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const mapNode = map.getNode()

    const handleMove = (moveEvent: PointerEvent) => {
      const rect = mapNode.getBoundingClientRect()
      const point = new kakao.maps.Point(moveEvent.clientX - rect.left, moveEvent.clientY - rect.top)
      const latlng = map.getProjection().coordsFromContainerPoint(point)
      const { dLat, dLng } = localOffsetKm(viewCenterRef.current, { lat: latlng.getLat(), lng: latlng.getLng() })
      const rawKm = Math.hypot(dLat, dLng) || MIN_DRAG_RADIUS_KM
      const km = Math.min(MAX_DRAG_RADIUS_KM, Math.max(MIN_DRAG_RADIUS_KM, rawKm))
      const scale = km / rawKm
      setRadiusHandle({ km, dLat: dLat * scale, dLng: dLng * scale })
    }

    const handleUp = () => {
      target.removeEventListener('pointermove', handleMove)
      target.removeEventListener('pointerup', handleUp)
      setRadiusHandle((current) => {
        onRadiusChangeRef.current?.(current.km)
        if (mapRef.current) refreshMarkers(mapRef.current, current.km)
        return current
      })
    }

    target.addEventListener('pointermove', handleMove)
    target.addEventListener('pointerup', handleUp)
  }, [refreshMarkers])

  /** 움직임이 멈췄을 때만: 뷰포트 기준 마커 재조회 + 새 중심의 주소 조회(둘 다 네트워크 호출이라
   * 드래그 중엔 부르지 않는다 — 실시간 갱신은 handleCenterChanged 가 담당). */
  const handleIdle = useCallback(
    (map: kakao.maps.Map) => {
      refreshMarkers(map)
      const c = map.getCenter()
      lookupAddress(c.getLat(), c.getLng())
    },
    [refreshMarkers, lookupAddress],
  )

  /** 빈 지도 영역을 클릭하면 그 지점으로 이동 — 마커 팝업은 각자 버튼에서 stopPropagation 하므로
   * 여기까지 올라오는 클릭은 항상 "배경 클릭"이다. 열려있던 팝업도 같이 닫는다. */
  const handleMapClick = useCallback((map: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
    setActiveId(null)
    map.panTo(mouseEvent.latLng)
  }, [])

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

  /** 클러스터에 묶이지 않은(또는 묶였다가 확대되어 풀린) 낱개 공고 핀 — 이름표 + 클릭 시
   * 급여·버튼이 담긴 상세 팝업. */
  function renderJobPin({ job, lat, lng, matched }: MapMarkerWithMatch) {
    return (
      <CustomOverlayMap
        key={job.id}
        position={{ lat, lng }}
        yAnchor={1}
        clickable
        zIndex={job.status === 'premium' ? 40 : job.status === 'special' ? 35 : matched ? 30 : 10}
      >
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
              <div className="flex items-center gap-1.5 pr-8">
                <JobBadge status={job.status} className="shrink-0" />
                <p className="truncate font-bold text-fg">{job.facilityName}</p>
              </div>
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
                'mb-0.5 max-w-[130px] truncate rounded-full px-2 py-0.5 text-xs font-bold shadow',
                job.status === 'special' && 'bg-accent text-white',
                job.status === 'premium' && 'border border-accent bg-surface text-accent-deep',
                job.status !== 'special' &&
                  job.status !== 'premium' &&
                  (matched ? 'bg-primary text-white' : 'bg-fg-subtle text-white'),
              )}
            >
              {job.facilityName}
            </span>
            <MapPin
              className={cn(
                job.status === 'premium' ? 'size-10 drop-shadow-lg' : 'size-8 drop-shadow-md',
                (job.status === 'special' || job.status === 'premium') && 'text-accent',
                job.status !== 'special' &&
                  job.status !== 'premium' &&
                  (matched ? 'text-primary' : 'text-fg-subtle'),
              )}
              fill={job.status === 'premium' ? 'white' : 'currentColor'}
              stroke={job.status === 'premium' ? 'currentColor' : 'white'}
              strokeWidth={job.status === 'premium' ? 2 : 1.5}
              aria-hidden
            />
          </button>
        </div>
      </CustomOverlayMap>
    )
  }

  /** 클러스터(2건 이상 묶인 마커)는 낱개 핀의 이름표 pill과 같은 모양으로 "N건 근처" 배지를
   * 보여준다 — 하나라도 필터에 걸리면 원색, 전부 필터에 안 걸리면 흐리게(낱개 핀의 matched
   * 표시와 같은 규칙). 클릭하면 그 지점 기준으로 확대된다. */
  function renderCluster(cluster: MarkerCluster) {
    const matched = cluster.items.some((item) => item.matched)
    return (
      <CustomOverlayMap
        key={cluster.items.map((item) => item.job.id).join('-')}
        position={{ lat: cluster.lat, lng: cluster.lng }}
        zIndex={matched ? 32 : 12}
        clickable
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            handleClusterClick(cluster)
          }}
          className={cn(
            'flex items-center gap-1 whitespace-nowrap rounded-full border border-white px-2.5 py-1 text-xs',
            'font-bold text-white shadow-lg transition-transform hover:scale-105',
            matched ? 'bg-primary' : 'bg-fg-subtle opacity-40',
          )}
        >
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {cluster.items.length}건 근처
        </button>
      </CustomOverlayMap>
    )
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
          center={center}
          level={levelForRadiusKm(radiusKm)}
          style={{ width: '100%', height: '100%' }}
          onCreate={handleMapCreate}
          onCenterChanged={handleCenterChanged}
          onZoomChanged={handleZoomChanged}
          onIdle={handleIdle}
          onClick={handleMapClick}
        >
          {/* 반경을 마커가 끊기는 지점으로 짐작하게 하지 않고 원으로 직접 보여준다
           * (요양나라 참고). 내 위치와 같은 accent 색 계열, 마커들보다 아래에 깔리게 낮은
           * zIndex. 지도를 움직이는 동안 viewCenter 가 실시간으로 갱신되므로 원도 화면
           * 가운데를 계속 따라간다. 반경은 radiusHandle.km — 핸들을 드래그하는 동안은
           * 그 값이 실시간으로 커지거나 작아지고, 손을 떼면 상위(radiusKm)에도 반영된다. */}
          <Circle
            center={viewCenter}
            radius={radiusHandle.km * 1000}
            strokeWeight={1.5}
            strokeColor="#b9612f"
            strokeOpacity={0.5}
            strokeStyle="shortdash"
            fillColor="#b9612f"
            fillOpacity={0.08}
            zIndex={0}
          />

          {/* 반경 원 가장자리의 드래그 핸들 — onRadiusChange 를 넘겨준 화면(지도 뷰)에서, 아래
           * "반경 직접 조절" 버튼을 눌러야 나타난다(기본은 숨김 — 항상 떠 있으면 지도가 복잡해
           * 보인다). 평소엔 정동쪽에 떠 있다가, 드래그하는 동안엔 커서 방향을 따라간다. */}
          {onRadiusChange && radiusAdjustOpen && (
            <CustomOverlayMap
              position={pointFromOffsetKm(viewCenter, radiusHandle.dLat, radiusHandle.dLng)}
              zIndex={5}
              clickable
            >
              <div className="relative flex flex-col items-center">
                <span className="mb-1 whitespace-nowrap rounded-full bg-fg/80 px-2 py-0.5 text-xs font-semibold text-white shadow">
                  {formatDistanceKm(radiusHandle.km)}
                </span>
                {/* "내 위치" 점(accent 색 원)과 헷갈리지 않도록 색과 모양을 다르게 —
                 * primary 색 사각 그립 + 이동 아이콘으로 "드래그해서 조절하는 핸들"임을
                 * 형태로도 드러낸다. */}
                <div
                  onPointerDown={handleRadiusHandlePointerDown}
                  role="slider"
                  aria-label="검색 반경 조절"
                  aria-valuenow={Math.round(radiusHandle.km * 1000)}
                  className={cn(
                    'flex size-7 touch-none items-center justify-center rounded-md border-2 border-white',
                    'bg-primary text-white shadow-lg',
                    'cursor-grab active:cursor-grabbing',
                  )}
                >
                  <Move className="size-4" aria-hidden />
                </div>
              </div>
            </CustomOverlayMap>
          )}

          {/* 내 위치 — 점 + 펄스 링(accent 색). 지도를 움직이면 viewCenter 를 따라 화면
           * 가운데에 실시간으로 붙어 있는다. zIndex 를 공고 핀(10~30)보다 낮춰서, 좌표가
           * 겹쳐도 공고 이름/핀이 항상 내 위치 점 위로 보이게 한다. */}
          <CustomOverlayMap position={viewCenter} zIndex={1}>
            <span className="relative flex size-7 items-center justify-center">
              <span className="absolute inline-flex size-7 animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-5 rounded-full border-2 border-white bg-accent shadow" />
            </span>
          </CustomOverlayMap>

          {clusters.map((cluster) =>
            cluster.items.length > 1 ? renderCluster(cluster) : renderJobPin(cluster.items[0]),
          )}
        </Map>

        {tooMany && (
          <p className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-fg/80 px-3 py-1.5 text-sm text-white">
            공고가 많아 일부만 표시돼요. 반경을 좁혀보세요.
          </p>
        )}

        {onRadiusChange && (
          <button
            type="button"
            onClick={handleToggleRadiusAdjust}
            aria-label="반경 직접 조절"
            title="반경 직접 조절"
            aria-pressed={radiusAdjustOpen}
            className={cn(
              'absolute bottom-3 right-16 z-[999] grid size-11 place-items-center rounded-full border shadow-overlay',
              radiusAdjustOpen
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-fg-muted hover:border-primary hover:text-primary-deep',
            )}
          >
            <Move className="size-5" aria-hidden />
          </button>
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
                    : item.job.status === 'special'
                      ? 'border-accent bg-accent text-white hover:brightness-95'
                      : item.job.status === 'premium'
                        ? 'border-accent bg-surface text-accent-deep hover:bg-accent-light'
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
