# 프론트 연동 전 백엔드 TODO 체크리스트

프론트가 붙인 화면(구인공고 목록/상세, 인재정보 목록/상세)은 현재 전부 mock 데이터다.
실 API(`/api/job-postings`, `/api/jobseekers`)로 교체하려면 아래 항목을 먼저 정리해야 한다.

- 대조 기준: `frontend/src/types/index.ts`, `frontend/src/data/filters.ts`,
  `frontend/src/components/job/job-filter-panel.tsx`, `frontend/src/components/talent/talent-filter-panel.tsx`
- 백엔드: `com.carematch.jobposting.*`, `com.carematch.member`(JobSeeker/TalentSearch)

작성일 2026-09-10 · 담당 접두사 `feature/be-*`

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

### 3. 인재 목록/상세 접근 권한

- 백엔드 `GET /api/jobseekers`, `GET /api/jobseekers/{id}` = `hasAnyRole('FACILITY','ADMIN')` + 승인 시설만
- 프론트 `/talents`, `/talents/:id` = 비로그인 포함 전체 공개로 구현됨

- [ ] 정책 결정: (a) 프론트가 로그인 + 시설승인 게이팅 추가 / (b) 백엔드가 공개용 인재 요약 목록 엔드포인트 별도 제공(마스킹 강화)
- [ ] `DESIGN_SYSTEM.md §21`(이름·연락처 마스킹) 기준과 정합성 확인

### 4. 지원자 수(applicantCount) 공고 응답에 추가

프론트 카드마다 "지원 N명" 표시. 백엔드 응답에 필드 없음.

- [ ] `SummaryResponse` / `DetailResponse`에 `applicantCount` 추가 (`Application` 집계 조인, N+1 주의)

---

## 🟡 필드 · 필터 레벨

### 구인공고

- [ ] **급여 필터 다중선택** — 프론트는 시급/일급/월급 체크박스 다중, 백엔드 `SearchCondition.payType`은 단일값 → `List<PayType>`로 변경
- [ ] **정렬 `PAY_ASC`(급여 낮은순) 추가** — 현재 `PAY_DESC`만 있음 (`sort` 허용값: `RECOMMENDED/LATEST/DEADLINE/PAY_DESC/VIEWS`)
- [ ] **공고 상세 담당자명(`managerName`)** — 프론트 상세 화면 필드. 백엔드는 `facilityName`·`facilityPhone`만, 담당자명 없음 (DTO TODO)
- [ ] **우대조건 태그(`tags: string[]`)** — 프론트는 태그 배열, 백엔드는 `preferredNote`(자유텍스트 1개)만
- [ ] **스페셜 카드 문구(`catchphrase`)** — 백엔드에 대응 필드 없음 (우선순위 낮음)
- [ ] **매칭 사유 구조화** — 프론트 `MatchingReason { kind, label, matched, detail }`, 백엔드 `matchingReasons: List<String>`(문구만). 홈 매칭칩("지역 일치"/"시간대 일치")에 구조체 필요
- [ ] **페이지 크기** — 프론트 목록은 10건/page, 백엔드 기본 `size=20`. 프론트가 `size=10` 명시하거나 기본값 합의

### 인재정보

- [ ] **자격증(certificates) 필터** — 프론트 필터 축인데 `TalentSearchDtos.SearchCondition`에 없음
- [ ] **경력 구간 필터** — 프론트 신입 / 1~3 / 3~5 / 5년+ 구간, 백엔드는 `minCareerYears`(하한)만. 구간(상한 포함) 매핑 또는 파라미터 추가
- [ ] **희망지역 다중** — 프론트 `Talent.regions: string[]`, 백엔드 `desiredSido`/`desiredSigungu` 단일. 다중 희망지역 모델 결정
- [ ] **정렬(경력 높은/낮은순)** — 프론트 `updated / careerDesc / careerAsc`. 백엔드는 "최근 갱신순 고정"(`sort` 파라미터 받지만 미사용). `CAREER_DESC/CAREER_ASC` 구현
- [ ] **급여 필터 다중선택** — 공고와 동일 이슈 (`payType` 단일값)

---

## 🟢 참고 — 프론트가 밀린 항목 (백엔드는 준비됨)

- 구직신청서 `/apply` : 백엔드(`POST /api/job-postings/{id}/applications`, `GET /api/members/me/applications` 등) 완비, 프론트는 placeholder
- 공고 스크랩(찜) : 백엔드 `POST/DELETE /api/job-postings/{id}/scrap`, `GET /api/members/me/scraps` 완비. 프론트 하트는 화면 상태만 토글 중 (인증 필요 — 비로그인 노출 처리 확인)
- 페이지네이션 응답 형식 : 백엔드 `PageResponse { content, page, size, totalElements, totalPages }`(0-base). 프론트 mock 은 단순 slice → 교체 시 형식 통일
