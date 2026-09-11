# 프론트 연동 전 백엔드 TODO 체크리스트

프론트가 붙인 화면(구인공고 목록/상세, 인재정보 목록/상세)은 작성 당시(2026-09-10) 전부 mock
데이터였다. 실 API(`/api/job-postings`, `/api/jobseekers`)로 교체하려면 아래 항목을 먼저 정리해야 한다.

- 대조 기준: `frontend/src/types/index.ts`, `frontend/src/data/filters.ts`,
  `frontend/src/components/job/job-filter-panel.tsx`, `frontend/src/components/talent/talent-filter-panel.tsx`
- 백엔드: `com.carematch.jobposting.*`, `com.carematch.member`(JobSeeker/TalentSearch)

작성일 2026-09-10 · 담당 접두사 `feature/be-*`

**2026-09-11 갱신**: 구인공고(job-posting) 쪽은 Phase A/B(PR #81/#82)로 **실 API 연동 완료**
(`frontend/src/api/job-postings.ts`, `frontend/src/lib/job-adapter.ts`). 아래 표시가
`[x]`인 항목은 그때 같이 반영됨. **인재정보(talent) 쪽은 여전히 전부 mock** —
`frontend/src/pages/TalentList/index.tsx`/`TalentDetail/index.tsx`가 `@/data/mock/talents`를
그대로 쓰고 `frontend/src/api/talents.ts` 자체가 없음(검색·필터·정렬·페이지네이션 전부 mock 위에서 동작).

---

## 🔴 구조 결정이 필요한 것 (프론트/백엔드 합의 → 팀장 확인)

### 1. 직종 · 근무형태 enum 체계 통일

| 축 | 백엔드 현재 | 프론트 현재 |
|---|---|---|
| 직종 | `JobType`: `CAREGIVER / NURSING_ASSISTANT / HOUSEKEEPER / LIFE_SUPPORT / ETC` | `요양보호사 / 간병인 / 가사도우미 / 사회복지사 / 간호조무사` |
| 근무형태 | `WorkType`: `COMMUTE / LIVE_IN / REMOTE / NEGOTIABLE` (출퇴근/입주 축) | `주간 / 오전 / 오후 / 야간 / 교대` (시간대 축) |

> 해결 방향 상세 설계는 **[`ENUM_MAPPING.md`](./ENUM_MAPPING.md)** 참고.

- [ ] `ENUM_MAPPING.md` 의 직종 최종 목록 + `WorkSchedule` 목록을 팀장이 승인
- [ ] 직종: `NURSING_ASSISTANT`(현 "간병인" 의미) → `CARE_ATTENDANT` 리네임, 간호조무사·사회복지사 값 추가
- [ ] 근무형태: 시간대 축 `WorkSchedule`(주간/오전/오후/야간/교대) 신규 필드 추가. 백엔드 `WorkType`(출퇴근/입주)은 유지
- [ ] V3 마이그레이션: `job_posting` / `jobseeker_profile` 의 enum CHECK 제약 교체 + 데이터 `UPDATE`
- [ ] 매칭(`MatchScoreCalculator`) 을 `WorkSchedule` 기준으로 이전/병행 — 후속 PR 분리 가능
- [ ] 전송 규약 확정: JSON 은 항상 enum name, 프론트가 라벨맵 보유 (`ENUM_MAPPING.md` 가 단일 소스)

### 2. 시설유형(FacilityType) 백엔드에 신설

프론트: 공고 카드마다 배지(요양원/방문요양센터/…), 목록 필터의 주요 축.
백엔드: `FacilityProfile`에 컬럼 없음. `JobPostingDtos` 주석에 `"시설유형/담당자/주소는 FacilityProfile 확장 후 채운다(TODO)"`.

- [ ] `FacilityType` enum 정의 (방문요양센터 / 요양원 / 주야간보호센터 / 재가복지센터 / 요양병원)
- [ ] `FacilityProfile`에 `facilityType` 컬럼 추가 + 마이그레이션(V3)
- [ ] 시설 회원가입 요청(`FacilitySignupRequest`)에 필드 추가
- [ ] `SummaryResponse` / `DetailResponse`에 `facilityType` 노출
- [ ] `SearchCondition` + `JobPostingSpecs`에 `facilityTypes` 다중 필터 추가

### 3. 인재 목록/상세 접근 권한 — **결정됨 (a): 비공개 유지**

- 백엔드 `GET /api/jobseekers`, `GET /api/jobseekers/{id}` = `hasAnyRole('FACILITY','ADMIN')` + 승인 시설만
- 프론트 `/talents`, `/talents/:id` = 비로그인 포함 전체 공개로 구현됨 → **게이트 추가 필요**

- 결정 (2026-09-10, 백엔드 경수): 인재 정보는 **승인 시설회원·관리자 전용**. 공개용 엔드포인트(b)는 안 만든다 — 집계 PII 노출 + 유료(연락처 열람) 기능 약화.
- [x] 백엔드: 이름 마스킹 서버측 강제 (목록 항상 `홍*동`, 상세는 unlock 시 실명) — `TalentSummary` / `JobSeekerProfileQueryService`
- [x] **프론트**: `/talents`·`/talents/:id` 라우트 가드 — `TalentAccessGate`(`components/talent/talent-access-gate.tsx`)가 두 라우트 감쌈
- [ ] 프론트: 클라이언트 `maskName()`(`lib/utils.ts`) 제거 — 백엔드가 이미 마스킹해 내려주는데 `talent-card.tsx`/`talent-list-card.tsx`/`talent-detail-header.tsx`가 아직도 호출 중(중복 처리, 지금은 talent 자체가 mock이라 안 드러남)
- [x] `DESIGN_SYSTEM.md §21`(이름·연락처 마스킹) 정합성 — 백엔드 응답이 §21 기준을 만족

### 4. 지원자 수(applicantCount) 공고 응답에 추가

프론트 카드마다 "지원 N명" 표시.

- [x] `SummaryResponse` / `DetailResponse`에 `applicantCount` (취소 제외 집계, 목록은 배치 조회). #58

---

## 🟡 필드 · 필터 레벨

### 구인공고

- [x] **급여 필터 다중선택** (`payTypes`) + **`PAY_ASC` 정렬** — #47 머지
- [x] **공고 상세 담당자명(`managerName`)** — `DetailResponse.managerName` = 시설회원 이름 (공고별 컬럼 없음). feature/be-jobposting-fields
- [x] **요건/우대사항/복리후생** — `requirements`/`preferences`/`benefits` 상세 응답 배열. `preferredNote` 폐기. feature/be-jobposting-fields (V8)
- [x] **경력무관 / minCareerYears** — `minCareerYears` 목록·상세 응답. 나머지 카드 태그는 프론트 파생. feature/be-jobposting-fields
- [x] **스페셜 카드 문구(`catchphrase`)** — 목록·상세 응답. feature/be-jobposting-fields (V8)
- [x] **매칭 사유 구조화** — `matchingReasons: List<MatchReason{kind,label,matched,detail}>` (category/region/schedule/pay, 충족·미충족 모두). 상세 응답 전용. feature/be-match-reasons-structured
  - [x] 프론트: `lib/job-adapter.ts`가 `ApiMatchReason` 구조체 직접 매핑 (문자열 변환 로직 없음)
- [x] **페이지 크기** — `JobList/index.tsx`가 `PAGE_SIZE`로 목록 쿼리에 `size` 명시, 응답은 `PageResponse` 그대로 사용

### 인재정보

- [x] **자격증(certificates) 필터** — 백엔드 `certificateTypes: CertificateType[]` 다중(OR). `certificate_type` enum 전환(자유 입력 정확일치 폐기), V9. 등록 시 종류 선택 필수. 상세 설계 [`ENUM_MAPPING.md`](./ENUM_MAPPING.md) §5. feature/be-certificate-type
  - [x] 프론트: 필터 체크박스 value → enum name — `data/filters.ts`의 `CERTIFICATE_OPTIONS`가 이미 enum name(`CAREGIVER` 등) 사용
  - [ ] 프론트: 자격증 **등록** 화면에 종류 select(+`OTHER` 이름칸) — `pages/MyPage/Certificates.tsx`는 아직 읽기 전용 목록뿐("자격증 추가·재확인은 파일 업로드 연동 후 제공될 예정입니다"). 2026-09-11 백엔드에 전화번호 인증 게이트(`CertificateService.register()`, PR #79)까지 붙었는데 붙일 프론트 화면이 아직 없는 상태
- [x] **경력 구간 필터** — 백엔드 `careerBuckets` 다중(OR). `ENTRY/Y1_3/Y3_5/Y5_PLUS`, 경력 미입력은 제외. feature/be-talent-search-filters (#deacd8b)
- [x] **희망지역 다중** — 백엔드 `desiredRegions: [{sido, sigungu}]` 최대 3 (`jobseeker_desired_region` 테이블, V7). 매칭 지역 축은 "희망지역 중 best". 검색 `sido`/`sigungu` = 그 지역을 희망지역에 넣은 인재. (feature/be-talent-desired-regions)
  - [ ] 프론트: `/apply`(`JobApply/index.tsx`, 실제론 "내 구직 프로필 등록" 화면) 다중 지역 입력 — 현재 시·도+구·군 단일 선택. `Talent.regions` 타입은 이미 배열
  - [ ] 이 화면 자체가 **저장 API 미연결** — 코드 주석: "저장 API 가 아직 연결되지 않아 등록은 화면 상의 완료 처리까지만 한다". 다중 지역보다 이게 선결 조건
- [x] **정렬(경력 높은/낮은순)** — 백엔드 `sort=LATEST/CAREER_DESC/CAREER_ASC` (경력 미입력은 뒤). feature/be-talent-search-filters (#deacd8b)
- [x] **급여 필터 다중선택** — 백엔드 `payTypes: PayType[]` 다중(OR). feature/be-talent-search-filters (#deacd8b)

---

## 🟢 참고 — 프론트가 밀린 항목 (백엔드는 준비됨)

- **구직신청서 `/apply`** : 여전히 밀림. 백엔드(`POST /api/job-postings/{id}/applications`,
  `GET /api/members/me/applications` 등)는 완비 — 지원 내역 **조회**는 `MyPage/Applications.tsx`가
  붙음(`api/applications.ts`). 근데 정작 **"이 공고에 지원하기" 자체가 없음** —
  `job-apply-panel.tsx`의 "온라인으로 지원하기" 버튼은 `/apply?jobId=...`로 이동만 하고,
  그 `/apply` 화면(`JobApply/index.tsx`)은 jobId 쿼리를 읽지도 않는 별개의 "프로필 등록" 화면
  (코드 주석: "특정 공고 지원은 이 화면에서 다루지 않으며, jobId 쿼리도 읽지 않는다"). 즉 지원
  액션을 시작할 방법 자체가 없음
- [x] **공고 스크랩(찜)** : 프론트 연동 완료 — `scrap-button.tsx`가 `api/scraps.ts`의
  `addScrap`/`removeScrap` 실제 호출
- [x] **페이지네이션 응답 형식** : 구인공고 쪽은 통일됨 — `api/job-postings.ts`가 `PageResponse`
  그대로 사용. 인재정보 쪽은 위에서 적었듯 API 자체가 없어 여전히 `TALENTS.slice()`(mock, 클라이언트
  페이지네이션)
