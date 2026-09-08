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
│   │                # EmptyState, LoadingState, PlaceholderPage
│   ├── layout/      # Header, Footer, Section, ProfileDropdown,
│   │                # FontSizeControl, MobileNav, SiteLayout, Logo
│   ├── job/         # JobCard, SpecialJobCard, JobTable, JobListItem,
│   │                # JobBadge, FacilityBadge
│   ├── talent/      # TalentCard
│   └── matching/    # MatchingScore
├── data/
│   ├── mock/        # jobs.ts, talents.ts, notices.ts  (API 연동 시 교체)
│   └── filters.ts   # 시·도, 구·군, 직종, 시설유형, 지역 바로가기
├── hooks/           # use-app(세션·글자크기), use-click-outside, use-dismissable
├── lib/             # cn, 포맷터(급여·날짜·마스킹), nav, site(고객센터 정보)
├── pages/           # Home/ ...
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
- [ ] 구인공고 목록 / 상세 / 등록
- [ ] 인재정보 목록 / 상세
- [ ] 구직신청서
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

## 알려진 제약

`typescript-eslint` 8.x 가 TypeScript 7 을 아직 peer 로 지원하지 않아 ESLint 는 `.js/.jsx` 만
검사합니다. `.ts/.tsx` 검증은 `npm run typecheck` 로 수행합니다.
