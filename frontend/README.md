# 케어매치 (CareMatch)

요양보호사·간병인·가사도우미와 방문요양센터·요양원·주야간보호센터를 연결하는
**구인구직 + 매칭 플랫폼** 프론트엔드입니다.

핵심 차별점은 단순 공고 게시판이 아니라 **구직자의 희망조건과 공고 조건을 비교한 매칭 점수**를
제공한다는 점이며, 이 규칙은 `MatchingScore` 컴포넌트 하나로만 표현합니다.

## 작업 전 반드시 읽을 문서

1. [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — 색상 / 타이포 / 스페이싱 / 레이아웃 / 화면별 규칙
2. [`COMPONENT_RULES.md`](./COMPONENT_RULES.md) — React 컴포넌트 구조 / props / 재사용 규칙

### 우선순위 (DESIGN_SYSTEM.md §2)

```
접근성·사용성 > 화면별 목업 > 디자인 시스템 > COMPONENT_RULES > 기존 코드 > 개발자 판단
```

목업이 디자인 시스템과 다르면 **해당 화면에서는 목업을 따르고**, 그 예외를 코드 주석과
디자인 시스템의 "화면별 예외"에 남깁니다. 전역 토큰은 바꾸지 않습니다. (§41)

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS v4 · Lucide React · React Router v7 ·
React Hook Form + Zod · Pretendard

- 전역 상태는 `src/hooks/use-app.tsx` (세션 + 글자크기) 하나로 충분해 Zustand 는 도입하지 않았습니다.
- API 연동 단계에서 TanStack Query 를 추가합니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run typecheck  # 타입 검사
npm run build      # 타입 검사 + 프로덕션 빌드
```

Vercel 배포 시 SPA 라우팅을 위해 `vercel.json` 의 rewrite 설정을 사용합니다.

## 디자인 토큰

모든 토큰은 `src/index.css` 의 `@theme` 에 있으며 `DESIGN_SYSTEM.md` 와 1:1 대응합니다.
**컴포넌트에서 임의의 hex 값을 쓰지 않습니다.** (`bg-[#2C7A68]` ✗ → `bg-primary` ✓)

| 문서 표기 | 클래스 | 값 |
| --- | --- | --- |
| Primary / Primary Dark / Primary Light | `primary` / `primary-deep` / `primary-light` | `#2C7A68` / `#1F6255` / `#EAF5F2` |
| Accent / Accent Light | `accent` / `accent-light` | `#B9612F` / `#F8EDE5` |
| Background / Surface | `bg` / `surface` | `#F7F7F4` / `#FFFFFF` |
| Text Primary / Secondary / Muted | `fg` / `fg-muted` / `fg-subtle` | `#263332` / `#61706D` / `#87938F` |
| Border / Border Strong | `border` / `border-strong` | `#DDE7E4` / `#C8D5D1` |
| Success / Warning / Danger / Info | `success` / `warning` / `danger` / `info` | `#2C7A68` / `#B9612F` / `#C94A4A` / `#4F7180` |

> Tailwind 의 `text-primary`(브랜드색)와 충돌하지 않도록 텍스트 색은 `fg` 계열로 명명했습니다.
> `Text Primary` = `text-fg`, `Text Secondary` = `text-fg-muted`, `Text Muted` = `text-fg-subtle`.

### Typography (§4)

**10 / 11 / 12px 토큰은 존재하지 않습니다.** 실수로 작은 글씨를 쓰는 경로 자체를 없앴습니다.

| 문서 | 클래스 | 크기 |
| --- | --- | --- |
| Display | `text-4xl` | 32px |
| Page Title | `text-3xl` | 30px |
| Section Title | `text-2xl` | 24px |
| Sub Title | `text-xl` | 20px |
| Card Title / Body Large | `text-lg` | 18px |
| Body | `text-base` | 16px |
| Caption | `text-sm` | 14px |
| Meta (등록일·갱신일) | `text-xs` | 13px |

### 크기 규격

- Input / Select 높이 **48px** (§12), Button `sm` 44 / `md` 48 / `lg` 56px (§11)
- Badge 14px / weight 600 / radius 6px (§14)
- Radius: `rounded-card`(10) · `rounded-panel`(12, Modal) · `rounded-btn`·`rounded-input`(8) · `rounded-badge`(6)
- 본문 컨테이너 `.container-page` = 1200px (모바일 16px / 그 이상 24px 좌우 여백)
- Header·Footer 는 목업 기준으로 본문보다 넓은 `max-w-chrome`(1400px) 정렬
- Breakpoint: `md` 768 / `lg` 1024 / `2xl` **1440**(디자인 기준 화면)

### 글자크기 조절 (§25)

GNB 의 `[기본] [크게] [더크게]` **세그먼트**가 `<html data-font-scale>` 로 루트 폰트 크기를
16 / 17.5 / 19px 로 바꿉니다. 모든 텍스트가 rem 이라 화면 전체가 함께 커지고,
컨테이너는 px 고정이라 레이아웃은 유지됩니다. 선택값은 localStorage 에 저장됩니다.

## 폴더 구조

```
src/
├── components/
│   ├── ui/          # Button, Input, Textarea, Select, Checkbox, RadioGroup,
│   │                # SegmentedControl, Badge, Tag, Modal, Drawer, Toast
│   ├── common/      # JobSearchBar, SectionHeader, Pagination, ScrapButton,
│   │                # EmptyState, LoadingState, PlaceholderPage,
│   │                # Breadcrumb, DetailSection
│   ├── layout/      # Header, Footer, Section, ProfileDropdown,
│   │                # FontSizeControl, MobileNav, SiteLayout, Logo
│   ├── job/         # JobCard, SpecialJobCard, JobTable, JobListItem,
│   │                # JobBadge, FacilityBadge, JobFilterPanel,
│   │                # JobDetailHeader, JobApplyPanel, ElderlyInfoCard
│   ├── talent/      # TalentCard, TalentListCard, TalentDetailHeader,
│   │                # TalentSearchBar, TalentFilterPanel
│   └── matching/    # MatchingScore
├── data/
│   ├── mock/        # jobs.ts, talents.ts, notices.ts  (API 연동 시 교체)
│   └── filters.ts   # 시·도, 구·군, 직종, 시설유형, 지역 바로가기
├── hooks/           # use-app(세션·글자크기), use-click-outside, use-dismissable
├── lib/             # cn, 포맷터(급여·날짜·마스킹), nav, site(고객센터 정보),
│                    # job-filters / talent-filters(목록 검색·필터·정렬 규칙)
├── pages/           # Home/, JobList/, JobDetail/, TalentList/, TalentDetail/,
│                    # JobApply/ ...
├── router/
└── types/           # Job, Talent, Matching, ElderlyInfo, Notice
```

## 공고 상태 배지 (§14)

5종을 `JobBadge` 하나로 그립니다.

| 상태 | 스타일 |
| --- | --- |
| 스페셜 | `#B9612F` 배경 / 흰 글씨 |
| 프리미엄 | 흰 배경 / `#B9612F` 테두리·글씨 |
| 새글 | `#2C7A68` 배경 / 흰 글씨 |
| 일반 | `#EAF5F2` 배경 / `#2C7A68` 글씨 |
| 마감임박 | `#C94A4A` 배경 / 흰 글씨 |

- **카드**: `isPromoted(status)` 로 스페셜·프리미엄만 노출
- **메인 최신 구인공고 TABLE**: 5종 전부 노출 (§14 화면별 예외)

## 매칭 점수 (§15)

```tsx
<MatchingScore score={92} reasons={job.matching.reasons} />               // 카드
<MatchingScore score={92} reasons={...} variant="detail" />              // 상세 패널
<MatchingScoreBadge score={92} />                                        // pill 단독
<MatchingReasonChips reasons={...} max={2} />                            // 사유 칩 단독
```

**점수에 따라 색상을 바꾸지 않습니다.** 모든 점수가 동일한 Primary pill 입니다.
pill 형태는 §8(과도한 pill 금지)의 명시적 예외입니다.

## 구현 현황

- [x] 디자인 토큰 · Global CSS
- [x] Header (태그라인 · 글자크기 세그먼트 · 로그인 후 상태) / Footer (Dark Green)
- [x] Button · Input · Textarea · Select · Checkbox · RadioGroup · SegmentedControl · Badge · Tag · Modal · Drawer · Toast · EmptyState · LoadingState
- [x] JobCard · SpecialJobCard · JobTable · JobBadge · FacilityBadge · MatchingScore · TalentCard
- [x] JobSearchBar · Section · SectionHeader · Pagination
- [x] **메인** — `capture/메인.png` 반영 완료
- [x] **구인공고 목록** — 검색·필터·정렬·페이지네이션 (mock 데이터 기준)
- [x] **구인공고 상세** — 화면 구현 완료 (지원·관심공고는 UI 만, API 미연결)
- [x] **인재정보 목록** — 검색·필터·정렬·페이지네이션 (mock 데이터 기준)
- [x] **인재정보 상세** — 화면 구현 완료 (연락처 열람은 API 연동 단계)
- [x] **구직신청** — 구직 프로필 작성 폼 (임시저장은 localStorage, 저장 API 미연결)
- [ ] 구인공고 등록
- [ ] 로그인 / 회원가입

## 메인 화면 구현 메모

- 구조는 `DESIGN_SYSTEM.md §27` 을 그대로 따릅니다.
  Hero → 검색 패널 → 맞춤 공고(4열) → 스페셜(3열, 민트 밴드) → 최신 구인공고(TABLE)
  → 최신 인재정보(4열) → 지역별 바로가기 → 공지사항+고객센터(2열)
- `§20` 에 따라 최신 구인공고는 **TABLE 하나만** 사용합니다. 카드 3열 중복 구조는 만들지 않습니다.
- `§40` 에 따라 **로그인한 개인회원 상태**를 기준으로 구현했습니다. 로그아웃 홈 분기는 범위 밖입니다.
- `§21` 에 따라 인재 이름은 데이터에 실명으로 두고 화면에서 `maskName()` 으로 마스킹합니다. (`김정회 → 김정○`)
- `§32` 에 따라 이미지는 자리표시자를 쓰되 **최종 영역 크기를 유지**합니다.
  히어로 일러스트 300×180, 스페셜 시설 사진 90×70, 인재 프로필 64px 원형.
  실제 이미지는 `Job.imageUrl` / `Talent.photoUrl` 에 경로만 넣으면 교체됩니다.

### 목업과 의도적으로 다른 부분

| 항목 | 목업 | 구현 | 이유 |
| --- | --- | --- | --- |
| 맞춤 공고 카드 배지 줄 | 매칭 pill + 사유 칩 2개가 한 줄 | 두 줄로 wrap | 본문 폭 1200px(§6) 기준 4열 카드는 288px 이라 한 줄에 들어가지 않음. 네 장 모두 배지 영역 높이를 고정해 본문 시작 위치를 맞춤 |
| 최신 구인공고 TABLE | 모든 폭에서 표 | 1024px 이상에서만 표, 그 아래는 세로 목록 | 7열 표를 태블릿 폭에 넣으면 가로 스크롤이 생기고 §38(가독성 우선)에 어긋남 |
| 인재 이름 | 실명 | 마스킹 | §21 |

## 구인공고 목록 구현 메모

라우트는 `/jobs` 이며 구조는 다음과 같습니다. (COMPONENT_RULES.md §17)

```
페이지 타이틀 → 검색(JobSearchBar compact) → 결과 요약 + 정렬
→ 좌 필터(248px) / 우 목록(JobListItem) → 페이지네이션
```

- 목적성이 높은 업무형 화면이라 **Hero 배너를 두지 않습니다.** 본문 폭은 메인과 같은 1200px 입니다.
- `JobSearchBar` 에 `variant="compact"` 를 추가했습니다. 메인의 리드 카피와 보조 버튼
  (내 주변 일자리 / 알림받기, §16 의 메인 전용 요소)만 감추고 검색 필드는 그대로 씁니다.
- 목록 행은 홈의 `JobCard` 를 복제하지 않고 `JobListItem` 을 사용합니다.
  정보 우선순위는 **시설명 + 직종 > 급여 > 지역 + 근무형태 > 근무시간 > 등록일 > 상태** 이고,
  상태 배지는 메인 TABLE 과 같이 5종을 모두 노출합니다. (§14 화면별 예외 — 목록에서는 상태가 비교 기준)
- 검색·필터·정렬 규칙은 `src/lib/job-filters.ts` 한 곳에 모아 필터 패널의 건수 집계와
  목록 필터링이 같은 기준을 쓰도록 했습니다.
- 좌측 필터 항목은 **기존 데이터 구조를 그대로** 씁니다. 직종/시설유형은 `CATEGORY_OPTIONS`,
  `FACILITY_TYPE_OPTIONS`, 지역은 `REGION_SHORTCUTS`(17개, 주요 8개 + 더보기),
  근무형태·급여는 `Job.workType` / `Job.payType` 에 1:1 대응하는 옵션을 새로 추가했습니다.
- 옵션 옆 건수는 **자기 그룹의 선택을 제외하고** 계산합니다. 같은 그룹에서 다른 항목을
  추가로 켤 때 건수가 0 으로 사라지지 않게 하기 위해서입니다.
- 정렬은 최신순 / 급여 높은순 / 급여 낮은순 3종입니다. 위치 기반 기능이 없어 거리순은 두지 않았습니다.
  급여 정렬은 시급·일급·월급을 월 환산(209시간 / 21일)해 비교하고, 급여 협의 공고는 항상 뒤로 보냅니다.
- 검색 조건과 정렬은 쿼리스트링에 반영되어 URL 로 공유됩니다. (`/jobs?sido=서울특별시&sort=payDesc`)
  좌측 체크박스 필터는 아직 URL 에 넣지 않고 화면 상태로만 관리합니다.
- 페이지당 10건이며, 백엔드 페이지네이션 전까지 mock 데이터를 클라이언트에서 자릅니다.
- 관심공고(하트)는 기존 `ScrapButton` 을 그대로 씁니다. 아직 저장 API 가 없어 화면 상태만 토글합니다.

## 구인공고 상세 구현 메모

라우트는 `/jobs/:jobId` 이며 구조는 다음과 같습니다. (COMPONENT_RULES.md §21, §22)

```
Breadcrumb → 공고 핵심 정보 → 근무조건 → 모집내용 → 어르신 정보 → 시설정보
→ 지원방법 → 유의사항 → 비슷한 구인공고
본문 1fr + 우측 sticky 340px (top 96px = Header 72px + 여백)
```

- **데이터가 없는 항목은 행·섹션 자체를 렌더링하지 않습니다.** `DetailRow` 가 값이 없으면
  `null` 을 반환하고, 모집내용·어르신 정보·전화 지원도 데이터가 있는 공고에서만 나타납니다.
  없는 정보를 화면에서 만들어내지 않기 위한 규칙입니다.
- 시각적 우선순위는 **공고 제목 > 시설명 > 급여 > 지역·근무형태 > 등록일** 입니다.
  목록에서는 시설명이 행 제목이지만, 상세에서는 제목이 h1 이고 시설명은 그 위 보조 라인입니다.
- 지도 API 가 없어 **지도 UI 를 만들지 않았습니다.** 주소 데이터가 있는 공고만 주소를 텍스트로 표시합니다.
- 상태 배지는 목록과 동일하게 5종을 모두 노출합니다. (§14 화면별 예외)
- 비슷한 구인공고는 추천 모델이 아니라 `getRelatedJobs()` 의 단순 유사도입니다.
  같은 직종(4점) > 같은 시·도(2점) > 같은 시설유형(1점) 순으로 점수를 매겨 상위 3건을 보여줍니다.
- 유의사항 문구는 공고 데이터가 아니라 서비스 공통 안내라 `lib/site.ts` 의 `JOB_APPLY_NOTICES` 에 두었습니다.

### 아직 기능이 없는 부분 (UI 만)

| 항목 | 현재 상태 |
| --- | --- |
| 지원하기 / 온라인으로 지원하기 | 구직신청 라우트 `/apply?jobId=...` 로 이동만 합니다. 해당 화면은 아직 PlaceholderPage 입니다. |
| 관심공고 | 기존 `ScrapButton` 재사용. 저장 API 가 없어 화면 상태만 토글되고 새로고침하면 사라집니다. |
| 전화 지원 | `job.managerPhone` 이 있는 공고(job-201)에만 `tel:` 링크로 노출됩니다. |

### `Job` 타입에 없어 표시하지 않은 항목

모집인원 · 학력 · 경력조건은 `Job` 타입에 필드가 없어 근무조건에서 제외했습니다.
필요하면 타입에 optional 필드를 추가하고 mock 데이터를 채우는 작업이 먼저입니다.

## 인재정보 목록 구현 메모

라우트는 `/talents` 이며 구조는 구인공고 목록과 같은 탐색 언어를 씁니다.

```
Breadcrumb → 페이지 타이틀 → 검색 → 결과 요약 + 정렬
→ 좌 필터(248px) / 우 카드 3열(283px) → 페이지네이션(12명/페이지)
```

- **메인의 `TalentCard` 는 건드리지 않았습니다.** 메인 카드는 요약·홍보 목적이고(DESIGN_SYSTEM.md §21)
  목록은 비교·탐색 목적이라 근무형태·경력이 더 필요해 `TalentListCard` 를 따로 두었습니다.
  카드 스타일(border 기반 white surface / radius 10 / 64px 원형 프로필)은 그대로 계승합니다.
- `JobSearchBar` 는 네 번째 필드가 시설유형으로 고정되어 있어 재사용하지 않고
  `TalentSearchBar`(지역·구·군·희망직종·근무형태·키워드)를 만들었습니다. 마크업과 스타일은 동일합니다.
- 이름은 기존 `maskName()` 정책 그대로입니다. (`정미숙 → 정미○`)
  실명은 화면에 노출되지 않으므로 **키워드 검색 대상에서도 제외**했습니다.
- 필터 인원수는 구인공고와 같은 방식으로 자기 그룹의 선택을 제외하고 셉니다.
  지역·자격증은 한 사람이 여러 값을 가질 수 있어 값마다 한 번씩 셉니다.
- 상태 배지는 `availableNow` 하나만 "즉시 근무 가능"(Badge `normal`)으로 씁니다.
  구인공고의 스페셜/프리미엄 배지는 인재정보에 쓰지 않습니다.

### `Talent` 타입 확장

`workType?: string` 하나를 추가했습니다. 검색·필터의 근무형태 기준값(주간/오전/오후/야간/교대)이며
`Job.workType` 과 같은 값 체계입니다. 기존 `preferredHours` 는 화면에 보여 주는
구체적 희망 시간대(자유 텍스트)로 역할을 분리해 그대로 두었습니다.

### 정렬 3종

`Talent` 에 `createdAt` 이 없어 "최신 등록순"은 만들지 않았습니다.
실제 데이터로 계산 가능한 **최근 수정순(`updatedAt`) / 경력 높은순 / 경력 낮은순**만 제공합니다.

### mock 데이터

`TALENTS` 를 4명 → **24명**으로 확장했습니다. 지역 7개 시·도, 직종 5종, 근무형태 5종,
경력 0~15년, 자격증 7종, 20~60대, 남녀가 고르게 분포하도록 구성했습니다.
`LATEST_TALENTS = TALENTS.slice(0, 4)` 는 그대로라 메인 4열은 기존과 동일합니다.

## 인재정보 상세 구현 메모

라우트는 `/talents/:talentId` 이며 구인공고 상세와 같은 레이아웃 언어를 씁니다.

```
Breadcrumb(홈 > 인재정보 > 인재 상세) → 프로필 핵심 영역
→ 본문 1fr (희망 근무조건 · 경력 및 자격사항 · 자기소개) + 우측 340px 이용 안내
→ 다른 인재정보 3열
```

- **우측은 액션 패널이 아니라 안내 영역입니다.** 프론트 mock `Talent` 에 전화번호 필드가 없고
  연락처 열람(`POST /api/jobseekers/{id}/contact/unlock`)은 백엔드에만 있어,
  동작하지 않는 CTA(연락하기·채용 제안·연락처 열람)를 만들지 않았습니다.
  `ScrapButton` 도 저장 기능이 연결되어 있지 않아 이 화면에서는 쓰지 않습니다.
- **경력은 연차(`careerLabel`)만 표시합니다.** mock 에 회사·기간 이력이 없어 상세 이력을 만들지 않았습니다.
- 이름은 기존 `maskName()` 정책 그대로입니다. (`김정회 → 김정○`)
- 프로필 사진은 `photoUrl` 이 없으면 96px 원형 placeholder 로 영역 크기를 유지합니다. (§32)
- 하단 "다른 인재정보"는 추천 모델이 아니라 **같은 희망직종 우선 + 최근 수정순**의 단순 선별이고,
  본인은 제외합니다. "AI 추천" 같은 표현은 쓰지 않습니다.
- `DetailRow` 가 값이 없으면 `null` 을 반환하므로, 데이터가 없는 항목은 행 자체가 사라집니다.

### 백엔드 API 와의 관계

`GET /api/jobseekers/{profileId}` 가 이미 있지만 프론트에는 아직 API 계층이 없어
이번 화면도 `getTalentById()` mock 기반입니다. API 응답에만 있는 필드
(phone, residence, education, availableTasks, desiredWorkDays, introduction 등)는
mock 에 임의로 추가하지 않았습니다.

## 구직신청 구현 메모

라우트는 `/apply` 이며 **내 구직 프로필 등록/수정** 화면입니다.

```
Breadcrumb → 페이지 제목
→ 본문 1fr (기본 정보 · 희망 근무조건 · 경력 및 자격 · 자기소개)
+ 우측 340px sticky (작성 상태 · 인재정보 미리보기 · 임시저장/등록)
```

- **특정 공고 지원과 분리했습니다.** 백엔드에서도 프로필 등록(`PUT /api/jobseekers/me`)과
  공고 지원(`POST /api/job-postings/{id}/applications`)은 다른 API 라,
  이 화면은 `jobId` 쿼리를 읽지 않습니다. 공고 지원은 추후 별도 라우트로 분리합니다.
- **폼 상태는 `useState`** 입니다. 공유 UI 컴포넌트가 `forwardRef` 가 아니어서
  react-hook-form 을 쓸 수 없습니다(Login 화면과 동일한 판단). UI 컴포넌트는 수정하지 않았습니다.
- **희망 지역은 시·도 + 구·군 단일 선택**입니다. `Talent.regions` 는 배열이지만,
  백엔드 `desiredSido` / `desiredSigungu` 와 이어지도록 폼은 한 곳만 받습니다.
- **이름은 입력받지 않습니다.** 회원정보의 이름을 사용하며, 미리보기에서 `maskName()` 으로 마스킹합니다.
- **비로그인은 폼을 보여주지 않고** 로그인 안내(EmptyState) + `/login` 링크만 제공합니다.
  기존 `useApp()` 의 `authReady` / `user` 만 사용하고 라우트 가드는 새로 만들지 않았습니다.
- 필수 항목은 **희망 직종 · 희망 지역 · 근무 형태** 3개입니다. 이 셋이 없으면
  인재정보 목록의 검색·필터에서 아예 걸리지 않기 때문입니다.
- 미리보기는 기존 `TalentListCard` 를 그대로 씁니다. 카드를 채울 만큼 입력됐을 때만 표시하고,
  빈 값을 임의로 채우지 않습니다.

### 임시저장

`localStorage` 키는 `carematch.jobApply.draft` 입니다
(`use-app` 의 `carematch.fontScale` / `carematch.easyMode` 규칙과 동일). 새로고침해도 복원됩니다.

### 저장 API 미연결

`PUT /api/jobseekers/me` 가 백엔드에 있지만 프론트에 jobseeker API 계층이 없어
"구직신청 등록"은 화면상의 완료 처리까지만 합니다. 완료 안내에서 그 사실을 밝히고,
`/talents` 와 입력한 희망조건이 반영된 `/jobs` 검색으로 이동할 수 있게 했습니다.

## 알려진 제약

`typescript-eslint` 8.x 가 TypeScript 7 을 아직 peer 로 지원하지 않아 ESLint 는 `.js/.jsx` 만
검사합니다. `.ts/.tsx` 검증은 `npm run typecheck` 로 수행합니다.
