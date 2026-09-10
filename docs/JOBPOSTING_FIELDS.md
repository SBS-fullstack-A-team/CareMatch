# 구인공고 필드 결정 문서 (프론트 ↔ 백엔드)

[`FRONTEND_INTEGRATION_TODO.md`](./FRONTEND_INTEGRATION_TODO.md) 🟡 구인공고 항목 중
데이터 모델/계약 결정이 필요했던 것들. 각 항목 제안 + 결정.

작성일 2026-09-10 · 상태: **§1·2·3·5 구현 (feature/be-jobposting-fields, V8) / §4 별도 PR / §6 프론트**

> 진행: enum 통일 §1~§4 머지 완료, WorkSchedule 매칭 병행(#64), 인재 검색 필터/이름 마스킹/희망지역 다중(#67·#68·#71).
> 신규 마이그레이션은 `V8__` (V6=desiredWorkSchedule, V7=desiredRegions).

전제
- 프론트 `Job` 타입: `frontend/src/types/index.ts`
- 프론트 상세 화면: `frontend/src/pages/JobDetail/index.tsx`
- 백엔드 DTO: `com.carematch.jobposting.dto.JobPostingDtos`

---

## 1. 담당자 정보 (`managerName` / `managerPhone` / `address`)

프론트 상세 화면이 쓰는 필드:
- `managerName` — "담당자" 행 + 지원 패널 "담당자 OOO"
- `managerPhone` — 지원 패널 전화 버튼 (`tel:` 링크)
- `address` — "주소" 행 (전체 주소 문자열)

백엔드 현재: `facilityName`, `facilityPhone`(= 시설회원 `member.phone`), `sido` / `sigungu` / `addressDetail`.
DTO 주석에 `"담당자/주소 TODO"`.

### 제안 — 최소 변경 (신규 컬럼/마이그레이션 없음)

| 프론트 필드 | 백엔드 처리 |
|---|---|
| `managerName` | `DetailResponse` 에 시설회원 이름(`member.name`, 가입 시 "김담당") 노출. 필드명 `managerName` |
| `managerPhone` | 이미 있는 `facilityPhone` 를 그대로 사용 (프론트가 매핑). 별도 추가 없음 |
| `address` | 프론트가 `sido + " " + sigungu + " " + addressDetail` 조합. 백엔드 변경 없음 |

- 근거: 이 규모에서 채용 담당자는 사실상 시설당 1명(가입한 시설회원)이라 공고별 담당자 컬럼은 과함.
- 공고별로 담당자가 달라야 하는 요구가 실제로 생기면 그때 `job_posting.manager_name` nullable 컬럼 추가(override, fallback = member.name).

### 작업 (백엔드) — 구현 완료 (feature/be-jobposting-fields)
- [x] `DetailResponse` 에 `managerName`(= `fp.getMember().getName()`) 추가
- [x] `docs/API.md` 상세 응답 예시 갱신

### 작업 (프론트)
- [ ] `Job.managerPhone` = 응답 `facilityPhone` 매핑, `Job.address` = 3필드 조합

---

## 2. 상세 요건 / 우대 / 복리후생 (`requirements` / `preferences` / `benefits`)

프론트 상세: `requirements[]`(자격 요건) · `preferences[]`(우대사항) · `benefits[]`(복리후생) 를
각각 불릿 리스트로 렌더 (`JobDetail/index.tsx` 172~188).

백엔드 현재: `preferredNote`(자유 텍스트 1개) + `duties[]`(담당 업무) + `requiredDocuments[]`(제출 서류).
→ 요건/복리후생 대응 필드 없음, 우대는 배열이 아니라 문자열 1개.

### 결정 — 구조화된 3개 배열 추가

`duties` / `requiredDocuments` 와 동일하게 **`@Convert(StringListConverter)` 콤마 문자열 컬럼** (element collection 테이블 아님 — 이 도메인 컨벤션 따름).

| 필드 | 의미 |
|---|---|
| `requirements: List<String>` | 자격 요건 (예: "요양보호사 자격증 소지자") |
| `preferences: List<String>` | 우대사항 (예: "요양원 근무 경험자") |
| `benefits: List<String>` | 복리후생 (예: "4대보험", "중식 제공") |

- `preferredNote`(자유 텍스트 1개)는 **폐기** — V8 에서 `preferences` 로 이관 후 컬럼 drop (프리런치, 실데이터 없음).
- **상세 응답 전용**. 목록 카드엔 안 실음.

### 작업 (백엔드) — 구현 완료
- [x] `CreateRequest` / `UpdateRequest` / `DetailResponse` 에 3필드 (varchar(2000) 콤마)
- [x] V8 마이그레이션: 컬럼 추가 + `preferred_note` → `preferences` 이관 + `preferred_note` drop
- [x] `JobPosting` 엔티티 + `UpdateForm`

### 작업 (프론트)
- [ ] `Job.requirements/preferences/benefits` 를 응답에서 직접 매핑 (이미 타입 존재)

---

## 3. 목록 카드 태그 (`tags: string[]`)

프론트 목록 카드 하단에 최대 4개 태그 (`job-list-item.tsx` 78). mock 예시: "집 근처", "경력무관", "주 5일", "퇴직금".

분석: `tags` 는 **저장 필드가 아니라 여러 사실의 표시용 집계**다.

| 태그 | 출처 |
|---|---|
| "집 근처" | 클라이언트가 사용자 위치로 계산 (서버 저장 불가) |
| "주 5일" | `workDays` 에서 파생 |
| "퇴직금" | `benefits` 포함 여부 |
| "경력무관" | 경력 요구 조건 |

### 제안 — 범용 `tags` 컬럼 만들지 않는다

- 프론트가 `workDays` / `benefits`(위 2번) / 위치 로 카드 태그를 **계산**.
- 유일하게 없는 구조화 값은 "경력무관" → `JobPosting.minCareerYears: Integer` nullable 추가
  (`null` 또는 `0` = 경력무관). 나중에 매칭 가중치에도 쓸 수 있어 이득.

### 작업 (백엔드) — 구현 완료
- [x] `CreateRequest`/`UpdateRequest`/`DetailResponse`/`SummaryResponse` 에 `minCareerYears` + V8 컬럼
- [ ] (선택) `MatchScoreCalculator` 에 경력 가중치 반영 — 후속

### 작업 (프론트)
- [ ] 카드 태그를 파생 계산으로 구현 (`workDays`/`benefits`/`minCareerYears`/위치). `Job.tags` → 파생. `Job.minCareerYears` 타입 추가 필요

---

## 4. 매칭 사유 구조화 (`matchingReasons`)

프론트 `MatchingReason { kind, label, matched, detail }` — 홈 "회원님께 맞는 공고" 카드칩,
공고 목록·상세 패널에서 사용. `kind` 로 아이콘 매핑, `matched=false` 는 상세 패널에서 "미충족"으로 표시.

백엔드 현재: `matchingReasons: List<String>` — 일치한 항목의 **문구만**, 미충족은 생략.

### 제안 — 구조체로 교체

```
record MatchReason(String kind, String label, boolean matched, String detail)
```

`kind` enum (프론트 `MatchingReasonKind` 와 1:1):

| kind | 백엔드 채점 가능? | 비고 |
|---|---|---|
| `category` | O (가중치 35) | 희망 직종 |
| `region` | O (30) | 희망 근무지 |
| `schedule` | O (20) | `WorkSchedule`(#55/#56 머지) 기준으로 이전 후. 매칭 이전은 §2 후속 PR |
| `pay` | O (15) | 희망 급여 |
| `facilityType` | △ | 필드는 있음(#58) — 구직자 희망 시설유형 필드가 없어서 채점 불가. 그거 생기면 |
| `career` | X | 경력 필드 없음 (위 3번 `minCareerYears` 도입 후) |

- 1차: `category/region/schedule/pay` 4개. 구직자가 지정한 축만, `matched` true/false 둘 다 emit.
- **근무형태(WorkType) 축**: #64 병행으로 점수엔 반영(10점)되지만 프론트 `kind` 가 없어 사유 칩은 안 만듦.
- `facilityType`/`career` 는 각 대응 희망조건 필드 도입 후.
- `label`: 충족 기준 문구 고정 — category→"직종 일치", region→"지역 일치", schedule→"근무 시간대 일치", pay→"급여 조건 충족". `matched=false` 면 프론트가 "미충족" 렌더.
- `detail`: region → 매칭된 공고 위치 "sido sigungu". 나머지는 enum name 또는 null.

### 작업 (백엔드) — 구현 완료 (feature/be-match-reasons-structured)
- [x] `MatchScoreCalculator.MatchResult.reasons` → `List<MatchReason>` (`JobPostingDtos.MatchReason`)
- [x] `DetailResponse.matchingReasons` 타입 변경. `SummaryResponse`·featured 는 reasons 안 실어서 변경 없음
- [x] `MatchScoreCalculatorTest` 갱신
- [x] `docs/API.md`

### 작업 (프론트)
- [ ] `matchingReasons` 를 응답 구조체로 직접 매핑 (문자열 변환 로직 제거). `MatchingReasonKind` 는 이미 일치

---

## 5. 스페셜 카드 홍보 문구 (`catchphrase`)

프론트 `Job.catchphrase` — SpecialJobCard 우측 사진 아래 짧은 문구 (`DESIGN_SYSTEM.md §19`).
상세 화면에서도 `job.catchphrase` 렌더 (`JobDetail/index.tsx` 220).

### 구현 완료

- [x] `JobPosting.catchphrase: String` (nullable, `@Size(max=100)`) + V8 컬럼
- [x] `CreateRequest`/`UpdateRequest`/`DetailResponse`/`SummaryResponse`
- [ ] 프론트: 등록 폼에서 SPECIAL 노출 선택 시에만 입력받게 (validation)

---

## 6. 페이지 크기

프론트 목록 10건/page, 백엔드 기본 `size=20` (상한 100).

### 제안 — 백엔드 변경 없음

- 프론트가 `?size=10` 명시. 끝.
- [ ] 프론트: 목록 쿼리에 `size=10` 고정

---

## 진행 상태

1. ✅ **백엔드 PR `feature/be-jobposting-fields`** (V8): §1 managerName + §2 요건/우대/복리 + §3 minCareerYears + §5 catchphrase. `preferred_note` 폐기
2. ✅ **§4 매칭사유 구조화** — `feature/be-match-reasons-structured` (`MatchReason{kind,label,matched,detail}`, category/region/schedule/pay)
3. ⬜ **프론트 PR** (`feature/fe-*`): 응답 매핑(requirements/preferences/benefits/managerName/catchphrase/matchingReasons), 카드 태그 파생, `Job.minCareerYears` 타입, `size=10`
4. ✅ `docs/API.md` 갱신
