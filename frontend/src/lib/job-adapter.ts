/**
 * 백엔드 구인공고 응답(JobPostingSummaryResponse/JobPostingDetailResponse) ->
 * 화면이 쓰는 `Job`(types/index.ts) 변환.
 *
 * 기존 컴포넌트(JobCard, JobListItem, JobTable, JobDetail 등)는 mock 시절 만들어진 `Job`
 * 형태를 그대로 기대하므로, API 응답과 mock 형태의 차이(문자열 id ↔ 숫자, region 합성,
 * 시간 문자열 합성, 상태 배지 파생 등)는 전부 이 파일 한 곳에서 흡수한다.
 * 컴포넌트/lib/job-filters 는 수정하지 않는다.
 *
 * 목록(SummaryResponse)에는 없고 상세(DetailResponse)에만 있는 필드
 * (employmentType, description, requirements 등)는 목록 변환에서 undefined 로 둔다 —
 * `Job` 타입에서 그 필드들이 optional 인 이유이기도 하다.
 */
import {
  careGradeLabel,
  cognitiveStatusLabel,
  mealStatusLabel,
  mobilityStatusLabel,
  payTypeFromApi,
} from '@/data/labels'
import { toRegionLabel } from '@/lib/job-filters'
import type {
  JobPostingDetailResponse,
  JobPostingSummaryResponse,
  MatchReason as ApiMatchReason,
} from '@/types/api'
import type { ElderlyInfo, Job, JobStatus, Matching, MatchingReasonKind } from '@/types'

/** "09:00:00" -> "09:00" */
function trimSeconds(time: string): string {
  return time.slice(0, 5)
}

function formatWorkHours(start: string, end: string): string {
  return `${trimSeconds(start)}~${trimSeconds(end)}`
}

/** "서울특별시" + "강남구" -> "서울 강남구" (mock Job.region 형태와 동일) */
function toRegion(sido: string, sigungu: string): string {
  return `${toRegionLabel(sido)} ${sigungu}`
}

/**
 * 상태 배지 (JobStatus) 파생. 실제 데이터엔 배지 값이 없고 exposureType/마감임박/신규
 * 여부로 계산한다. 우선순위: 스페셜 > 프리미엄 > 마감임박 > 신규 > 일반.
 */
function deriveStatus(dto: {
  exposureType: string
  isClosingSoon: boolean
  isNew: boolean
}): JobStatus {
  if (dto.exposureType === 'SPECIAL') return 'special'
  if (dto.exposureType === 'PREMIUM') return 'premium'
  if (dto.isClosingSoon) return 'closing'
  if (dto.isNew) return 'new'
  return 'normal'
}

/** 매칭 정보. matchingScore 가 없으면(비로그인·희망조건 미설정) 아예 undefined. */
function toMatching(matchingScore: number | null, reasons?: ApiMatchReason[]): Matching | undefined {
  if (matchingScore == null) return undefined
  return {
    score: matchingScore,
    reasons: (reasons ?? []).map((r) => ({
      kind: r.kind as MatchingReasonKind,
      label: r.label,
      matched: r.matched,
      detail: r.detail ?? undefined,
    })),
  }
}

/**
 * 목록/카드용 태그. mock 처럼 임의 문구("집 근처" 등)를 만들지 않고
 * 실제 데이터에서 확인 가능한 것만 뽑는다 (docs/JOBPOSTING_FIELDS.md §3).
 */
function deriveTags(minCareerYears: number | null, workDays: string, benefits?: string[]): string[] {
  const tags: string[] = []
  if (!minCareerYears) tags.push('경력무관')
  if (/주\s*5일/.test(workDays)) tags.push('주 5일')
  if (benefits) tags.push(...benefits.slice(0, 2))
  return tags
}

/** 목록/카드/테이블 — `GET /api/job-postings`, `/featured`, `/{id}/similar` 응답 1건. */
export function summaryToJob(dto: JobPostingSummaryResponse): Job {
  return {
    id: String(dto.id),
    title: dto.title,
    facilityName: dto.facilityName,
    facilityType: dto.facilityType ?? 'ETC',
    region: toRegion(dto.sido, dto.sigungu),
    district: dto.sigungu,
    category: dto.jobType,
    workSchedule: dto.workSchedule,
    workHours: formatWorkHours(dto.workStartTime, dto.workEndTime),
    workDays: dto.workDays,
    payType: payTypeFromApi(dto.payType),
    payAmount: dto.payAmount,
    status: deriveStatus(dto),
    postedAt: dto.createdAt.slice(0, 10),
    deadline: dto.deadline ?? undefined,
    catchphrase: dto.catchphrase ?? undefined,
    imageUrl: dto.thumbnailUrl ?? undefined,
    viewCount: dto.viewCount,
    applicantCount: dto.applicantCount,
    matching: toMatching(dto.matchingScore),
    scrapped: dto.scrapped,
    tags: deriveTags(dto.minCareerYears, dto.workDays),
  }
}

/** 상세 — `GET /api/job-postings/{id}` 응답. */
export function detailToJob(dto: JobPostingDetailResponse): Job {
  const elderly: ElderlyInfo = {
    grade: careGradeLabel(dto.careGrade),
    gender: dto.elderGender === 'MALE' ? '남' : '여',
    ageGroup: dto.elderAgeRange ?? '',
    mobility: mobilityStatusLabel(dto.mobilityStatus),
    meal: mealStatusLabel(dto.mealStatus) || undefined,
    cognition: cognitiveStatusLabel(dto.cognitiveStatus) || undefined,
    careTasks: dto.duties.length > 0 ? dto.duties : undefined,
    note: dto.elderNote ?? undefined,
  }

  return {
    id: String(dto.id),
    title: dto.title,
    facilityName: dto.facilityName,
    facilityType: dto.facilityType ?? 'ETC',
    region: toRegion(dto.sido, dto.sigungu),
    district: dto.sigungu,
    category: dto.jobType,
    employmentType: dto.employmentType,
    workSchedule: dto.workSchedule,
    workHours: formatWorkHours(dto.workStartTime, dto.workEndTime),
    workDays: dto.workDays,
    payType: payTypeFromApi(dto.payType),
    payAmount: dto.payAmount,
    status: deriveStatus(dto),
    postedAt: dto.createdAt.slice(0, 10),
    deadline: dto.deadline ?? undefined,
    catchphrase: dto.catchphrase ?? undefined,
    imageUrl: dto.thumbnailUrl ?? undefined,
    viewCount: dto.viewCount,
    applicantCount: dto.applicantCount,
    matching: toMatching(dto.matchingScore, dto.matchingReasons),
    scrapped: dto.scrapped,
    tags: deriveTags(dto.minCareerYears, dto.workDays, dto.benefits),
    elderly,
    description: dto.description ?? undefined,
    requirements: dto.requirements.length > 0 ? dto.requirements : undefined,
    preferences: dto.preferences.length > 0 ? dto.preferences : undefined,
    benefits: dto.benefits.length > 0 ? dto.benefits : undefined,
    managerName: dto.managerName,
    managerPhone: dto.facilityPhone ?? undefined,
    address: `${dto.sido} ${dto.sigungu}${dto.addressDetail ? ` ${dto.addressDetail}` : ''}`,
  }
}
