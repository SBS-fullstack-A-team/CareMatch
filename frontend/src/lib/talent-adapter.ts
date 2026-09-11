/**
 * 백엔드 인재(구직자) 응답(TalentSummaryResponse/JobSeekerProfileResponseDto) ->
 * 화면이 쓰는 `Talent`(types/index.ts) 변환. job-adapter.ts 와 같은 방식으로, mock 시절
 * 만들어진 `Talent` 형태와 API 응답의 차이를 이 파일 한 곳에서 흡수한다.
 *
 * 목록(TalentSummaryResponse)에는 없고 상세(JobSeekerProfileResponseDto)에만 있는 필드
 * (summary/phone/residence/contactUnlocked 등)는 목록 변환에서 undefined 로 둔다.
 * 반대로 상세 응답에는 updatedAt 이 없어(백엔드가 안 내려줌) 상세로 만든 Talent 는
 * updatedAt 이 없다 — `Talent.updatedAt` 이 optional 인 이유다.
 */
import { payTypeFromApi } from '@/data/labels'
import { toRegionLabel } from '@/lib/job-filters'
import type {
  JobSeekerProfileResponseDto,
  RegionDto,
  TalentSummaryResponse,
} from '@/types/api'
import type { CertificateType, Talent } from '@/types'

/** "09:00:00" -> "09:00" */
function trimSeconds(time: string): string {
  return time.slice(0, 5)
}

function toRegions(regions: RegionDto[]): string[] {
  return regions.map((region) =>
    region.sigungu ? `${toRegionLabel(region.sido)} ${region.sigungu}` : toRegionLabel(region.sido),
  )
}

function toGender(gender: 'MALE' | 'FEMALE' | null): '여' | '남' | undefined {
  if (gender === 'MALE') return '남'
  if (gender === 'FEMALE') return '여'
  return undefined
}

function toCareerLabel(careerYears: number | null): string | undefined {
  if (careerYears == null) return undefined
  return careerYears === 0 ? '신입' : `경력 ${careerYears}년`
}

/** 희망 근무시간 자유 텍스트 — desiredWorkDays + 시작·종료 시각을 합성한다. 없으면 undefined. */
function toPreferredHours(
  workDays: string | null,
  startTime: string | null,
  endTime: string | null,
): string | undefined {
  const hours = startTime && endTime ? `(${trimSeconds(startTime)} ~ ${trimSeconds(endTime)})` : ''
  const text = [workDays ?? '', hours].filter(Boolean).join(' ').trim()
  return text || undefined
}

/** 목록 카드 — `GET /api/jobseekers` 응답 1건. */
export function summaryToTalent(dto: TalentSummaryResponse): Talent {
  return {
    id: String(dto.profileId),
    name: dto.name,
    gender: toGender(dto.gender),
    age: dto.age ?? undefined,
    category: dto.desiredJobType ?? undefined,
    regions: toRegions(dto.desiredRegions),
    certificates: dto.certificateTypes as CertificateType[],
    photoUrl: dto.photoUrl ?? undefined,
    updatedAt: dto.updatedAt.slice(0, 10),
    careerLabel: toCareerLabel(dto.careerYears),
    careerYears: dto.careerYears ?? undefined,
    workSchedule: dto.desiredWorkSchedule ?? undefined,
    preferredHours: toPreferredHours(dto.desiredWorkDays, dto.desiredWorkStartTime, dto.desiredWorkEndTime),
    payType: dto.desiredPayType ? payTypeFromApi(dto.desiredPayType) : undefined,
    payAmount: dto.desiredMinPay ?? undefined,
    matching: dto.matchingScore != null ? { score: dto.matchingScore, reasons: [] } : undefined,
    availableNow: dto.employmentStatus === 'SEEKING',
  }
}

/** 상세 — `GET /api/jobseekers/{id}`, `GET /api/jobseekers/me` 공용 응답. */
export function detailToTalent(dto: JobSeekerProfileResponseDto): Talent {
  return {
    id: String(dto.profileId),
    name: dto.name,
    gender: toGender(dto.gender),
    age: dto.age ?? undefined,
    category: dto.desiredJobType ?? undefined,
    regions: toRegions(dto.desiredRegions),
    certificates: dto.certificates.map((c) => c.certificateType) as CertificateType[],
    photoUrl: dto.photoUrl ?? undefined,
    // 상세 응답엔 updatedAt 이 없다 — "최근 업데이트" 행은 값이 있을 때만 렌더링된다.
    updatedAt: undefined,
    careerLabel: toCareerLabel(dto.careerYears),
    careerYears: dto.careerYears ?? undefined,
    workSchedule: dto.desiredWorkSchedule ?? undefined,
    preferredHours: toPreferredHours(dto.desiredWorkDays, dto.desiredWorkStartTime, dto.desiredWorkEndTime),
    payType: dto.desiredPayType ? payTypeFromApi(dto.desiredPayType) : undefined,
    payAmount: dto.desiredMinPay ?? undefined,
    summary: dto.introduction ?? undefined,
    matching: dto.matchingScore != null ? { score: dto.matchingScore, reasons: [] } : undefined,
    availableNow: dto.employmentStatus === 'SEEKING',
    phone: dto.phone,
    residence: dto.residence,
    contactUnlocked: dto.contactUnlocked,
    unlockCost: dto.unlockCost,
  }
}
