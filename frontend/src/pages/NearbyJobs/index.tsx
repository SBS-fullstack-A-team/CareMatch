import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useKakaoLoader } from 'react-kakao-maps-sdk'
import { getNearbyJobPostings } from '@/api/job-postings'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { Pagination } from '@/components/common/pagination'
import { EMPTY_JOB_FILTER_COUNTS, JobFilterPanel, type JobFilterCounts } from '@/components/job/job-filter-panel'
import { JobListItem } from '@/components/job/job-list-item'
import { NearbyMap } from '@/components/job/nearby-map'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Tag } from '@/components/ui/tag'
import { useToast } from '@/components/ui/toast'
import { CATEGORY_OPTIONS, FACILITY_TYPE_OPTIONS, PAY_TYPE_OPTIONS, WORK_SCHEDULE_OPTIONS } from '@/data/filters'
import { useAsync } from '@/hooks/use-async'
import { useGeolocation } from '@/hooks/use-geolocation'
import { summaryToJob } from '@/lib/job-adapter'
import {
  applyFilters,
  countByOption,
  EMPTY_JOB_FILTERS,
  type JobFilterGroup,
  type JobFilterState,
} from '@/lib/job-filters'
import { cn, formatDistanceKm, formatNumber } from '@/lib/utils'
import { LoadFailed } from '@/pages/Support/shared'
import type { Job } from '@/types'

const PAGE_SIZE = 10
/** 리스트 반경 — 통근 가능 거리 기준이라 km 단위로 넓게 잡는다. */
const RADIUS_OPTIONS_KM = [1, 3, 5, 10, 20] as const
type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number]
/** 지도 반경 — 지도에서 한눈에 비교하기엔 도보권이 더 유용해 m 단위로 좁게 잡는다. */
const MAP_RADIUS_OPTIONS_KM = [0.1, 0.25, 0.5, 1] as const
type MapRadiusKm = (typeof MAP_RADIUS_OPTIONS_KM)[number]

/** 값(CAREGIVER, hourly)과 표기 라벨(요양보호사, 시급)이 다른 필터의 칩 표기용 라벨 */
const FILTER_VALUE_LABEL = Object.fromEntries(
  [...PAY_TYPE_OPTIONS, ...CATEGORY_OPTIONS, ...FACILITY_TYPE_OPTIONS, ...WORK_SCHEDULE_OPTIONS].map(
    (option) => [option.value, option.label],
  ),
) as Record<string, string>

/** 목록 카드 맨 앞에 거리를 태그로 붙인다 (Job 타입엔 거리 필드가 없어 tags 로 흡수) */
function withDistanceTag(job: Job, distanceKm: number): Job {
  return { ...job, tags: [formatDistanceKm(distanceKm), ...(job.tags ?? [])] }
}

/**
 * 내 주변 일자리 (/nearby)
 *
 * 브라우저 GPS 로 현재 위치를 받아 `GET /api/job-postings/nearby`(반경 내 가까운 순)로
 * 목록을, `/in-bounds`(지도 뷰포트)로 지도 마커를 보여준다. 목록 결과가 이미 제한적인
 * 범위(최대 100건)라 좌측 필터는 서버 재조회 없이 클라이언트에서 적용한다.
 */
export function NearbyJobsPage() {
  const { status, coords: gpsCoords, request } = useGeolocation()
  const requestedRef = useRef(false)
  useEffect(() => {
    if (!requestedRef.current) {
      requestedRef.current = true
      request()
    }
  }, [request])

  const [kakaoLoading, kakaoError] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
    libraries: ['services'],
  })
  const { toast } = useToast()
  /** 주소 검색으로 위치를 직접 지정하면 GPS 대신 이 좌표를 기준으로 찾는다 — GPS 권한이 없거나
   * 다른 지역을 미리 둘러보고 싶을 때를 위한 보조 수단. */
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const coords = manualLocation ?? gpsCoords

  /** 카카오 우편번호(주소 검색) 서비스 스크립트 — 지도 SDK 와 별도 스크립트라 따로 로드한다.
   * 건물명/지번/도로명을 다 지원하는 공식 검색 팝업이라 직접 만든 자동완성보다 정확하다. */
  const [postcodeLoaded, setPostcodeLoaded] = useState(false)
  useEffect(() => {
    if (typeof kakao !== 'undefined' && kakao.Postcode) {
      setPostcodeLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = '//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => setPostcodeLoaded(true)
    document.head.appendChild(script)
  }, [])

  const applyLocation = (lat: number, lng: number, label: string) => {
    setManualLocation({ lat, lng, label })
    setPage(1)
  }
  const handleAddressSearch = () => {
    if (!postcodeLoaded || kakaoLoading || kakaoError) return
    new kakao.Postcode({
      oncomplete: (data) => {
        const address = data.roadAddress || data.jibunAddress
        const geocoder = new kakao.maps.services.Geocoder()
        geocoder.addressSearch(address, (result, resultStatus) => {
          if (resultStatus === kakao.maps.services.Status.OK && result[0]) {
            applyLocation(Number(result[0].y), Number(result[0].x), address)
          } else {
            toast({ title: '주소를 찾을 수 없어요. 다른 주소로 다시 시도해보세요.', variant: 'error' })
          }
        })
      },
    }).open()
  }
  const handleUseGps = () => {
    setManualLocation(null)
    if (status !== 'granted') request()
  }

  const [radiusKm, setRadiusKm] = useState<RadiusKm>(10)
  const [mapRadiusKm, setMapRadiusKm] = useState<MapRadiusKm>(1)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [filters, setFilters] = useState<JobFilterState>(EMPTY_JOB_FILTERS)
  const [page, setPage] = useState(1)
  /** 지도가 지금 자기 반경 안에서 들고 있는 원본 공고 — 지도 뷰에서는 필터 건수 배지를
   * 리스트(jobs)가 아니라 이걸 기준으로 계산해야 실제로 지도에 뜬 마커 수와 맞는다. */
  const [mapJobs, setMapJobs] = useState<Job[]>([])

  const { data, loading, error, reload } = useAsync(
    () =>
      coords
        ? getNearbyJobPostings({ lat: coords.lat, lng: coords.lng, radiusKm })
        : Promise.resolve([]),
    [coords?.lat, coords?.lng, radiusKm],
  )

  const jobs = useMemo(
    () => (data ?? []).map((result) => withDistanceTag(summaryToJob(result.posting), result.distanceKm)),
    [data],
  )
  const filtered = useMemo(() => applyFilters(jobs, filters), [jobs, filters])
  /** 좌측 필터 패널은 리스트/지도 뷰가 같이 쓰지만, 건수 배지의 기준 데이터는 뷰마다 다르다 —
   * 리스트는 jobs(리스트 반경), 지도는 mapJobs(지도 반경 + 뷰포트)로 따로 셈해야 실제로
   * 화면에 보이는 개수와 배지 숫자가 맞는다. */
  const countsBaseJobs = view === 'map' ? mapJobs : jobs
  const counts: JobFilterCounts = useMemo(
    () =>
      countsBaseJobs.length === 0
        ? EMPTY_JOB_FILTER_COUNTS
        : {
            regions: countByOption(countsBaseJobs, filters, 'regions'),
            categories: countByOption(countsBaseJobs, filters, 'categories'),
            facilityTypes: countByOption(countsBaseJobs, filters, 'facilityTypes'),
            workSchedules: countByOption(countsBaseJobs, filters, 'workSchedules'),
            payTypes: countByOption(countsBaseJobs, filters, 'payTypes'),
          },
    [countsBaseJobs, filters],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageJobs = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilters = Object.values(filters).some((group) => group.length > 0)

  const handleFiltersChange = (next: JobFilterState) => {
    setFilters(next)
    setPage(1)
  }
  const removeFilterValue = (group: JobFilterGroup, value: string) => {
    handleFiltersChange({ ...filters, [group]: filters[group].filter((item) => item !== value) })
  }
  const resetFilters = () => handleFiltersChange(EMPTY_JOB_FILTERS)
  const handleRadiusChange = (value: string) => {
    setRadiusKm(Number(value) as RadiusKm)
    setPage(1)
  }
  const handleMapRadiusChange = (value: string) => setMapRadiusKm(Number(value) as MapRadiusKm)

  /** GPS 권한 상태와 무관하게, 주소를 직접 검색해 찾았다면 그 좌표로 위치가 확정된 것으로 본다. */
  const located = coords != null

  return (
    <div className="container-page py-6 lg:py-8">
      <Breadcrumb items={[{ label: '홈', to: '/' }, { label: '내 주변 일자리' }]} />

      <header className="mt-3">
        <h1 className="text-3xl font-bold text-fg">내 주변 일자리</h1>
        <p className="mt-2 text-base text-fg-muted">현재 위치를 기준으로 가까운 일자리를 찾아드려요.</p>
      </header>

      {/* ---------------- 위치 상태 안내 ---------------- */}
      <div className="mt-5 rounded-card border border-primary/35 bg-primary-light/60 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary-deep" aria-hidden />
            <div>
              {located && (
                <>
                  <p className="text-base font-bold text-fg">
                    {manualLocation ? '검색한 위치 기준으로 찾고 있어요' : '현재 위치 기준으로 찾고 있어요'}
                  </p>
                  <p className="mt-0.5 text-base text-fg-muted">
                    {manualLocation && `${manualLocation.label} · `}반경{' '}
                    {formatDistanceKm(view === 'map' ? mapRadiusKm : radiusKm)} 이내 공고를 보여드립니다.
                  </p>
                </>
              )}
              {!located && (status === 'idle' || status === 'loading') && (
                <p className="text-base font-bold text-fg">현재 위치를 확인하고 있어요...</p>
              )}
              {!located && status === 'denied' && (
                <>
                  <p className="text-base font-bold text-fg">위치 권한이 필요해요</p>
                  <p className="mt-0.5 text-base text-fg-muted">
                    브라우저 위치 권한을 허용하거나, 아래에서 주소를 직접 검색해 주세요.
                  </p>
                </>
              )}
              {!located && status === 'unsupported' && (
                <p className="text-base font-bold text-fg">이 브라우저는 위치 확인을 지원하지 않아요.</p>
              )}
              {!located && status === 'error' && (
                <>
                  <p className="text-base font-bold text-fg">위치를 확인하지 못했어요</p>
                  <p className="mt-0.5 text-base text-fg-muted">잠시 후 다시 시도하거나, 주소를 직접 검색해 주세요.</p>
                </>
              )}
            </div>
          </div>

          {!located && status !== 'unsupported' && (
            <Button variant="secondary" size="sm" onClick={request} disabled={status === 'loading'}>
              {status === 'loading' ? '확인 중...' : '다시 시도'}
            </Button>
          )}
        </div>

        {/* ---------------- 주소 직접 검색 (카카오 우편번호 서비스) ---------------- */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={!postcodeLoaded || kakaoLoading}
            className={cn(
              'flex h-11 max-w-xs flex-1 items-center gap-2 rounded-input border border-border-strong bg-surface px-4',
              'text-left text-base text-fg-muted transition-colors hover:border-primary disabled:opacity-50',
            )}
          >
            <Search className="size-[18px] shrink-0" aria-hidden />
            <span className="truncate">{manualLocation ? manualLocation.label : '주소로 검색'}</span>
          </button>
          {manualLocation && (
            <Button type="button" variant="ghost" size="sm" onClick={handleUseGps}>
              <LocateFixed className="size-[18px]" aria-hidden /> 내 위치로
            </Button>
          )}
        </div>
      </div>

      {located && coords && (
        <>
          {/* ---------------- 반경 + 보기 방식 ---------------- */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base text-fg-muted">반경</span>
              {view === 'map' ? (
                <SegmentedControl
                  items={MAP_RADIUS_OPTIONS_KM.map((km) => ({ value: String(km), label: formatDistanceKm(km) }))}
                  value={String(mapRadiusKm)}
                  onChange={handleMapRadiusChange}
                />
              ) : (
                <SegmentedControl
                  items={RADIUS_OPTIONS_KM.map((km) => ({ value: String(km), label: formatDistanceKm(km) }))}
                  value={String(radiusKm)}
                  onChange={handleRadiusChange}
                />
              )}
            </div>
            <SegmentedControl
              items={[
                { value: 'map', label: '지도' },
                { value: 'list', label: '리스트' },
              ]}
              value={view}
              onChange={(value) => setView(value as 'list' | 'map')}
            />
          </div>

          {/* ---------------- 결과 요약 (리스트 전용) ---------------- */}
          {view === 'list' && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p className="text-lg text-fg-muted">
                주변 일자리{' '}
                <strong className="font-bold text-primary-deep tabular">{formatNumber(filtered.length)}</strong>건
              </p>
            </div>
          )}

          {hasFilters && (
            <div className={cn('flex flex-wrap items-center gap-2', view === 'list' ? 'mt-3' : 'mt-6')}>
              {(Object.keys(filters) as JobFilterGroup[]).flatMap((group) =>
                filters[group].map((value) => (
                  <Tag key={`${group}-${value}`} onRemove={() => removeFilterValue(group, value)}>
                    {FILTER_VALUE_LABEL[value] ?? value}
                  </Tag>
                )),
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-7 items-center px-1 text-sm text-fg-muted underline underline-offset-4 hover:text-primary-deep"
              >
                전체 해제
              </button>
            </div>
          )}

          {/* ---------------- 좌: 필터 / 우: 목록 또는 지도 ---------------- */}
          <div className="mt-5 gap-6 lg:flex">
            <JobFilterPanel
              className="mb-6 self-start lg:mb-0 lg:w-[248px] lg:shrink-0"
              value={filters}
              onChange={handleFiltersChange}
              onReset={resetFilters}
              counts={counts}
              hideRegions
            />

            {view === 'map' ? (
              <NearbyMap
                center={coords}
                radiusKm={mapRadiusKm}
                filters={filters}
                onJobsChange={setMapJobs}
                className="h-[560px] min-w-0 flex-1 lg:sticky lg:top-[88px] lg:self-start"
              />
            ) : (
              <section className="min-w-0 flex-1" aria-label="내 주변 구인공고 목록">
                {loading ? (
                  <div className="overflow-hidden rounded-card border border-border">
                    <LoadingState rows={PAGE_SIZE} />
                  </div>
                ) : error ? (
                  <LoadFailed message={error} onRetry={reload} />
                ) : pageJobs.length > 0 ? (
                  <ul className="overflow-hidden rounded-card border border-border">
                    {pageJobs.map((job) => (
                      <li key={job.id} className="border-b border-border last:border-b-0">
                        <JobListItem job={job} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-card border border-border bg-surface">
                    <EmptyState
                      title="주변에 등록된 일자리가 없습니다."
                      description="반경을 넓히거나 필터를 초기화해보세요."
                      action={
                        <Button variant="secondary" size="sm" onClick={resetFilters}>
                          필터 초기화
                        </Button>
                      }
                    />
                  </div>
                )}

                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} className="mt-8" />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  )
}
