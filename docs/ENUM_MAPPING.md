# 공유 Enum 매핑 (프론트 ↔ 백엔드)

프론트가 붙인 화면을 실 API로 연동하기 전, 직종·근무형태 등 공유 enum의
체계를 통일하기 위한 설계 문서. [`FRONTEND_INTEGRATION_TODO.md`](./FRONTEND_INTEGRATION_TODO.md) §1 의 상세판.

작성일 2026-09-10 · 상태: **초안 (팀장 승인 대기)**

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

### 작업 (백엔드)

- [ ] `JobType` enum 값 교체
- [ ] V3 마이그레이션
  - `job_posting.job_type`, `jobseeker_profile.desired_job_type` 의 `CHECK` 제약 drop → 신규 값으로 재생성
  - `UPDATE job_posting SET job_type = 'CARE_ATTENDANT' WHERE job_type = 'NURSING_ASSISTANT'`
  - `jobseeker_profile.desired_job_type` 동일 처리
  - 인덱스 `(status, sigungu, job_type)` 재생성 확인
- [ ] 시드(`config/LocalDataInitializer`) 갱신
- [ ] 영향 지점 확인: `MatchScoreCalculator`(equality 비교), `TalentMatcher`, `JobSeekerProfileSpecs`, `ApplicationDtos`

### 작업 (프론트)

- [ ] `JobCategory` 타입을 enum name 유니온으로 변경
- [ ] `JOB_TYPE_LABELS: Record<JobCategory, string>` 라벨맵 추가
- [ ] `data/mock/jobs.ts`, `data/filters.ts`(`CATEGORY_OPTIONS`) 갱신

> ⚠️ 프리런치 + 로컬 H2 `create-drop` + prod DB 벤더 미정 → **지금 하는 게 비용 최저**. 미루면 계속 커진다.

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

### 작업 (백엔드)

- [ ] `WorkSchedule` enum 신설
- [ ] `JobPosting` 에 `workSchedule` 컬럼 + V3 마이그레이션(컬럼 + `CHECK`)
- [ ] `CreateRequest` / `UpdateRequest` / `DetailResponse` / `SummaryResponse` 에 필드 추가
- [ ] `SearchCondition` + `JobPostingSpecs` 에 `workSchedules` **다중** 필터 추가
- [ ] (후속 PR 분리 가능) `JobSeekerProfile.desiredWorkSchedule` + `MatchScoreCalculator`
      W_WORK_TYPE(20) 를 `WorkSchedule` 기준으로 이전/병행

### 작업 (프론트)

- [ ] `Job.workType`(현재 "주간" 등 한글 문자열) → `workSchedule` enum name 으로 교체
- [ ] `WORK_SCHEDULE_LABELS` 라벨맵
- [ ] `data/filters.ts`(`WORK_TYPE_OPTIONS`), `lib/job-filters.ts`, mock 갱신

---

## 3. 고용형태 (EmploymentType) — 우선순위 낮음

| 백엔드 | 프론트 |
|---|---|
| `FULL_TIME(정규직) / CONTRACT(계약직) / TEMPORARY(임시직) / PART_TIME(아르바이트)` | 정규직 / 계약직 / 시간제 / 파트타임 / 단기 |

- 프론트가 **시간제·파트타임을 둘 다** 값으로 둠 = 사실상 같은 개념 중복. `단기` ≈ `TEMPORARY`.
- 프론트 필터 패널엔 아직 고용형태 그룹 미노출(`EMPLOYMENT_TYPE_OPTIONS` 정의만 있고 미사용).
- [ ] 프론트가 백엔드 4개 값으로 정리 (시간제/파트타임 통합). 백엔드 변경 없음.

### 확정 라벨 (제안)

| 한글 | enum name |
|---|---|
| 정규직 | `FULL_TIME` |
| 계약직 | `CONTRACT` |
| 단기 | `TEMPORARY` |
| 파트타임 | `PART_TIME` |

---

## 진행 순서

1. 이 문서의 직종 목록 + `WorkSchedule` 목록을 **팀장이 승인**
2. **백엔드 PR** (`feature/be-*`): `JobType` 재정의 + `WorkSchedule` 신규 + V3 마이그레이션 + 시드/매칭
3. **프론트 PR** (`feature/fe-*`): 타입 enum name 화 + 라벨맵 + mock/필터 — 2번과 병렬
4. `docs/API.md` 목록/검색 파라미터 표 갱신
5. 실 API 연동
