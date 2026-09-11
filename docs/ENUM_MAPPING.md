# 공유 Enum 매핑 (프론트 ↔ 백엔드)

프론트가 붙인 화면을 실 API로 연동하기 전, 직종·근무형태 등 공유 enum의
체계를 통일하기 위한 설계 문서. [`FRONTEND_INTEGRATION_TODO.md`](./FRONTEND_INTEGRATION_TODO.md) §1 의 상세판.

작성일 2026-09-10 · 상태: **§1~§3 머지 완료 · §4 백엔드 머지 / 프론트(#61) 리뷰 대기**

---

## 공통 원칙

| 항목 | 결정 |
|---|---|
| 전송 포맷 | JSON 은 **항상 enum name**(`CAREGIVER`). 한글 라벨은 절대 안 실음 |
| 한글 라벨 소유 | 프론트 (`JOB_TYPE_LABELS` 등 라벨맵). 백엔드는 enum name 만 책임 |
| 단일 소스 | **이 문서**. 양 팀이 여기만 보고 라벨맵/enum 을 만든다 |
| 목록 확정 소유 | 도메인/기획(팀장). 코드가 아니라 서비스가 taxonomy 를 정한다 |
| 잘못된 값 | Jackson 매핑 실패 → `GlobalExceptionHandler` 가 400 `COMMON_001` |

---

## 1. 직종 (JobType)

프론트·백엔드 목록이 서로 다르나 **각 항목이 모두 실존 역할**이라 합집합으로 확정한다.

### 확정 목록 (제안)

| 한글 | enum name | 현재 상태 | 정의 |
|---|---|---|---|
| 요양보호사 | `CAREGIVER` | 유지 | 국가자격 요양보호사 |
| 간병인 | `CARE_ATTENDANT` | **리네임** (`NURSING_ASSISTANT` → ) | 병원·시설 간병, 비자격 포함 |
| 간호조무사 | `NURSE_AIDE` | **신규** | 국가자격 간호조무사 (요양병원·요양원) |
| 사회복지사 | `SOCIAL_WORKER` | **신규** | 센터 상담·케이스 관리 |
| 생활지원사 | `LIFE_SUPPORT` | 유지 | 노인맞춤돌봄서비스 안부확인·가사지원 |
| 가사도우미 | `HOUSEKEEPER` | 유지 | 가정 내 가사 지원 |
| 기타 | `ETC` | 유지 | 위에 없는 직종 |

### 핵심: `NURSING_ASSISTANT` 폐기

- 현재 enum name 은 "간호조무사"인데 주석·데이터 의미는 "간병인" → 방치 시 프론트가 오해.
- `NURSING_ASSISTANT` 이름은 완전히 버리고, 간병인은 `CARE_ATTENDANT`, 간호조무사는 `NURSE_AIDE` 로 분리.

### 작업 (백엔드) — 구현: `feature/be-jobtype-enum`

- [x] `JobType` enum 값 교체
- [x] V3 마이그레이션 (`V3__jobtype_redefine.sql`)
  - `job_posting.job_type`, `jobseeker_profile.desired_job_type` 의 `CHECK` 제약 drop → 신규 값으로 재생성
  - `UPDATE ... SET job_type = 'CARE_ATTENDANT' WHERE job_type = 'NURSING_ASSISTANT'` (두 테이블)
  - 인덱스 `(status, sigungu, job_type)` — 값 변경만이라 재생성 불필요 (확인 완료)
- [x] 시드 — `LocalDataInitializer` 는 공고/구직 시드 없음(약관·관리자·공지만) → 변경 불필요
- [x] 영향 지점: `MatchScoreCalculator`(값 무관 equality), `TalentMatcher`·`ApplicationDtos`(`.name()` 문자열), `JobSeekerProfileSpecs`(값 무관) — 코드 변경 없음. 기존 테스트는 `NURSING_ASSISTANT` 미사용

### 작업 (프론트) — 머지: PR #53

- [x] `JobCategory` 타입 enum name 유니온
- [x] `frontend/src/data/labels.ts` 신설 — `JOB_CATEGORY_LABELS` + `jobCategoryLabel()`
- [x] `data/mock/jobs.ts`·`talents.ts`, `data/filters.ts`(`CATEGORY_OPTIONS`), 표시 컴포넌트, 키워드 검색 haystack, 조건 칩 갱신

---

## 2. 근무형태 — 축이 두 개다

| 축 | 의미 | 현재 |
|---|---|---|
| **근무 형태** (`WorkType`) | "어디서 자느냐" — 출퇴근 / 입주 / 재택 / 협의 | 백엔드에만 있음 |
| **근무 시간대** (신규 `WorkSchedule`) | "언제 일하느냐" — 주간 / 오전 / 오후 / 야간 / 교대 | 프론트에만 있음 |

두 축 모두 유효하다. `WorkType` 을 갈아엎지 않고 `WorkSchedule` 을 **신규 추가**한다.

### 신규 enum `WorkSchedule`

| 한글 | enum name |
|---|---|
| 주간 | `DAY` |
| 오전 | `MORNING` |
| 오후 | `AFTERNOON` |
| 야간 | `NIGHT` |
| 교대 | `SHIFT` |

### 설계 결정

- **명시 필드**로 저장 (시설이 등록 폼에서 직접 선택). 파생 계산 아님:
  - "교대"(2교대·3교대)는 단일 `workStartTime`~`workEndTime` 으로 **표현 불가**.
    (프론트 mock 에 이미 `workHours: '2교대'` 문자열 존재 = 현 모델은 교대근무 미지원)
  - 시간 파싱("18시 이후면 야간")은 경계값에서 깨지고 필터·매칭 신뢰도 낮음.
- `workStartTime` / `workEndTime` 은 정밀 표시용으로 유지.
  화면의 "주간 · 09:00~13:00" = `WorkSchedule` + 시간.
- `WorkType` = `LIVE_IN`(입주형)은 24h라 스케줄 무의미 → `WorkSchedule` **nullable**.
- `WorkType`(출퇴근/입주)은 프론트가 나중에 별도 필터로 채택 (COMPONENT_RULES §17 에 자리 있음).

### 작업 (백엔드) — 머지: PR #55, #59(검증)

- [x] `WorkSchedule` enum 신설 (DAY/MORNING/AFTERNOON/NIGHT/SHIFT)
- [x] `JobPosting.workSchedule` 컬럼(nullable) + `V4__jobposting_work_schedule.sql`
- [x] `CreateRequest` / `UpdateRequest` / `DetailResponse` / `SummaryResponse` 필드 추가
- [x] `SearchCondition` + `JobPostingSpecs` 에 `workSchedules` 다중 필터
- [x] `workType != LIVE_IN` 이면 `workSchedule` 필수 검증 (PR #59)
- [ ] (후속 PR) `JobSeekerProfile.desiredWorkSchedule` + `MatchScoreCalculator`
      W_WORK_TYPE(20) 를 `WorkSchedule` 기준으로 이전/병행 — 매칭 로직은 별도

### 작업 (프론트) — 머지: PR #56

- [x] `Job.workType` → `Job.workSchedule: WorkSchedule | null`, `Talent.workType` → `workSchedule`
- [x] `WORK_SCHEDULE_LABELS` / `workScheduleLabel()`
- [x] `data/filters.ts`(`WORK_SCHEDULE_OPTIONS`), `lib/job-filters.ts`·`talent-filters.ts`, mock, `JobApplyDraft` 갱신

---

## 3. 고용형태 (EmploymentType) — 프론트 머지 완료 (PR #57)

| 백엔드 | 프론트 |
|---|---|
| `FULL_TIME(정규직) / CONTRACT(계약직) / TEMPORARY(임시직) / PART_TIME(아르바이트)` | 정규직 / 계약직 / 시간제 / 파트타임 / 단기 |

- 프론트가 **시간제·파트타임을 둘 다** 값으로 둠 = 사실상 같은 개념 중복. `단기` ≈ `TEMPORARY`.
- 프론트 필터 패널엔 아직 고용형태 그룹 미노출(`EMPLOYMENT_TYPE_OPTIONS` 정의만 있고 미사용).
- [x] 프론트가 백엔드 4개 값(enum name)으로 정리 — 시간제·파트타임 모두 `PART_TIME`. 백엔드 변경 없음. (PR `feature/fe-employment-type`)

### 확정 라벨

| 한글 | enum name |
|---|---|
| 정규직 | `FULL_TIME` |
| 계약직 | `CONTRACT` |
| 단기 | `TEMPORARY` |
| 파트타임 | `PART_TIME` |

---

## 4. 시설유형 (FacilityType)

시설회원이 가입 시 선택. 프론트 공고 카드 배지·목록 필터의 주요 축.

| 한글 | enum name |
|---|---|
| 방문요양센터 | `VISITING_CARE` |
| 요양원 | `NURSING_HOME` |
| 주야간보호센터 | `DAY_NIGHT_CARE` |
| 재가복지센터 | `COMMUNITY_CARE` |
| 요양병원 | `NURSING_HOSPITAL` |
| 기타 | `ETC` |

### 작업 (백엔드) — 머지 완료: PR #58

- [x] `FacilityType` enum 신설
- [x] `FacilityProfile.facilityType` 컬럼(nullable — V5 이전 가입 시설) + `V5__facility_type.sql`
- [x] `FacilitySignupRequest.facilityType` `@NotNull`, `SocialRoleSelectionRequest.facilityType` (role=FACILITY 시 검증)
- [x] `SummaryResponse` / `DetailResponse` 에 `facilityType` + `SearchCondition.facilityTypes` 필터 + 공고 응답 `applicantCount`

### 작업 (프론트) — 리뷰 대기: PR #61

- [x] `FacilityType` 타입 enum name 유니온 (`types/index.ts`)
- [x] `FACILITY_TYPE_LABELS` / `facilityTypeLabel()` 라벨맵 (`data/labels.ts`)
- [x] `data/filters.ts`(`FACILITY_TYPE_OPTIONS` value → enum name)
- [x] `mock/jobs.ts`(`facilityType`), 표시 컴포넌트(`facility-badge`·`job-card`·`JobDetail`), `lib/job-filters.ts` 갱신 (§1 직종과 동일 패턴)
- [x] `JobList`·`NearbyJobs` 조건 칩 `FILTER_VALUE_LABEL` 에 시설유형 추가 (NearbyJobs 는 `FILTER_VALUE_LABEL` 로 승격)

---

## 5. 자격증 종류 (CertificateType)

구직자가 자격증 등록 시 선택. 인재 검색 필터의 자격증 축(`certificateTypes`, 다중 OR).
등록 전엔 `certificate_name` 자유 입력 + 정확 일치 검색이라 표기 흔들림(`요양보호사` vs `요양보호사 1급`)으로
필터가 사실상 무력했음 → enum 으로 전환.

| 한글 | enum name |
|---|---|
| 요양보호사 | `CAREGIVER` |
| 간호조무사 | `NURSE_AIDE` |
| 사회복지사 1급 | `SOCIAL_WORKER_1` |
| 사회복지사 2급 | `SOCIAL_WORKER_2` |
| 간병사 | `CARE_ASSISTANT` |
| 운전면허 | `DRIVER_LICENSE` |
| 기타 | `OTHER` |

> ⚠️ 최종 목록(사회복지사 급수 분리·운전면허 포함 여부)은 팀장 승인 항목.

### 이 축만의 예외: 라벨을 백엔드가 보유

다른 enum 과 달리 한글 라벨을 `CertificateType.label()` 이 갖는다. 등록 시 `certificate.certificate_name`
(표시용 컬럼, `nullable=false`)을 이 라벨로 채우기 때문. `OTHER` 는 사용자가 입력한 이름을 그대로 저장한다.
프론트도 라벨맵을 별도로 두되(필터 UI), 응답의 `certificateName` 을 그대로 표시해도 된다.

### 작업 (백엔드) — 구현: `feature/be-certificate-type`

- [x] `CertificateType` enum 신설 (라벨 포함)
- [x] `certificate.certificate_type` 컬럼(`not null`) + `V9__certificate_type.sql`. 기존 행은 `OTHER` 백필(이름 보존)
- [x] `CreateCertificateRequest.certificateType` `@NotNull`. `certificateName` 은 `OTHER` 일 때만 필수(공백이면 400 `COMMON_001`)
- [x] 검색 필터 `certificateNames: string[]` → `certificateTypes: CertificateType[]` (`JobSeekerProfileSpecs` EXISTS 서브쿼리 `certificate_type in`)
- [x] `CertificateDetailResponse` / `CertificateResponse` 에 `certificateType` 노출
- [x] `docs/API.md` §6·§7 갱신

### 작업 (프론트) — feature/fe-*

- [ ] `CertificateType` 타입 enum name 유니온 + `CERTIFICATE_TYPE_LABELS` 라벨맵
- [ ] 자격증 필터 체크박스 value → enum name (`data/filters.ts`), 인재 검색 쿼리 `certificateTypes` 반복 파라미터
- [ ] `/apply` 자격증 입력: 종류 select + `OTHER` 선택 시 이름 입력칸
- [ ] `Talent`·자격증 표시 컴포넌트 — 응답 `certificateName`/`certificateType` 매핑

---

## 진행 상태

- §1 직종 — **머지 완료** (#52 백 / #53 프)
- §2 근무 시간대 — **머지 완료** (#55 백 / #56 프 / #59 검증). 매칭 이전은 후속 PR
- §3 고용형태 — **머지 완료** (#57 프)
- §4 시설유형 — 백엔드 **머지 완료** (#58), 프론트 **리뷰 대기** (#61)
- §5 자격증 종류 — 백엔드 **PR 대기** (`feature/be-certificate-type`), 프론트 미착수
- 남은 것: 매칭(`MatchScoreCalculator`)을 `WorkSchedule` 기준으로 이전 + `JobSeekerProfile.desiredWorkSchedule` + 프론트 프로필 폼 → 별도 PR
- `docs/API.md` 는 각 PR 에서 함께 갱신됨
