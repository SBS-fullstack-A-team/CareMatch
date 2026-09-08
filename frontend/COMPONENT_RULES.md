# CareMatch Component Rules

> 케어매치 프론트엔드 컴포넌트 구현 규칙이다.
>
> DESIGN_SYSTEM.md의 시각적 규칙을 실제 React 컴포넌트로 구현하기 위한 문서다.

---

# 1. Core Principle

컴포넌트는 다음 세 가지를 동시에 만족해야 한다.

```text
재사용성
+
디자인 일관성
+
화면별 유연성
```

무조건 모든 것을 하나의 거대한 컴포넌트로 만들지 않는다.

반대로 화면마다 동일한 UI를 복사해서 만들지도 않는다.

---

# 2. Component Architecture

권장 구조:

```text
src/
├── components/
│   ├── common/
│   ├── layout/
│   ├── job/
│   ├── talent/
│   ├── matching/
│   └── form/
│
├── pages/
│   ├── Home/
│   ├── JobList/
│   ├── JobDetail/
│   ├── JobCreate/
│   ├── TalentList/
│   ├── TalentDetail/
│   ├── JobApplication/
│   └── Auth/
│
├── data/
│   └── mock/
│
├── types/
│
├── hooks/
│
├── lib/
│
└── router/
```

---

# 3. Common Components

다음 컴포넌트는 공통 컴포넌트로 관리한다.

```text
Button
Input
Select
Checkbox
Radio
SegmentedControl
Badge
Tag
Modal
Drawer
Dropdown
Pagination
EmptyState
LoadingState
```

---

# 4. Layout Components

```text
Header
Footer
PageContainer
Section
TwoColumnLayout
```

Header와 Footer는 모든 페이지에서 동일한 컴포넌트를 사용한다.

---

# 5. Header Rules

컴포넌트:

```text
Header
```

Props 예:

```ts
type HeaderProps = {
  isLoggedIn?: boolean;
  userType?: "PERSONAL" | "FACILITY";
};
```

로그인 전:

```text
로그인
회원가입
```

로그인 후:

```text
포인트
알림
프로필
```

시설회원에게만 포인트 잔액을 표시한다.

Header 내부의 navigation 구조를 페이지별로 복사하지 않는다.

---

# 6. Button Rules

컴포넌트:

```text
Button
```

Variant:

```text
primary
secondary
accent
danger
ghost
```

Size:

```text
sm
md
lg
```

기본:

```text
height: 44px
border-radius: 8px
```

주요 CTA:

```text
온라인 지원하기
검색
다음
저장
회원가입
```

는 primary를 사용한다.

유료 상품:

```text
프리미엄
스페셜
```

은 accent를 사용한다.

---

# 7. JobBadge Rules

컴포넌트:

```text
JobBadge
```

지원:

```ts
type JobBadgeType =
  | "SPECIAL"
  | "PREMIUM"
  | "NEW"
  | "CLOSING_SOON";
```

예:

```tsx
<JobBadge type="SPECIAL" />
<JobBadge type="PREMIUM" />
<JobBadge type="NEW" />
<JobBadge type="CLOSING_SOON" />
```

일반 공고는 badge를 렌더링하지 않는다.

---

# 8. FacilityBadge

시설 유형:

```text
방문요양
요양원
주야간보호
입주요양
```

시설명과 시각적으로 구분한다.

시설 유형은 보조 정보이므로
직종 제목보다 시각적 강조가 강하면 안 된다.

---

# 9. MatchingScore

컴포넌트:

```text
MatchingScore
```

Props:

```ts
type MatchingScoreProps = {
  score: number;
  reasons?: string[];
  variant?: "card" | "detail";
};
```

예:

```tsx
<MatchingScore
  score={92}
  reasons={[
    "지역 일치",
    "시간대 일치",
    "급여 조건 충족"
  ]}
/>
```

매칭 점수는 숫자만 보여주지 말고
가능하면 매칭 사유를 함께 제공한다.

---

# 10. JobCard

핵심 컴포넌트:

```text
JobCard
```

Props:

```ts
type Job = {
  id: string;

  facilityName: string;
  facilityType: string;

  title: string;

  region: string;

  workDays: string;
  workTime: string;

  salary: string;

  elderlySummary?: string;

  deadline?: string;

  views?: number;

  isNew?: boolean;
  isClosingSoon?: boolean;

  promotion?: "SPECIAL" | "PREMIUM" | null;

  matchingScore?: number;

  matchingReasons?: string[];

  isScrapped?: boolean;
};
```

---

# 11. JobCard Layout

권장 구조:

```text
┌─────────────────────────────┐
│ [스페셜]             ♡      │
│                             │
│ 강남소망재가노인복지센터      │
│ 방문요양                     │
│                             │
│ 방문요양 요양보호사 모집      │
│                             │
│ 서울 강남구                  │
│ 월~금 13:00~16:00            │
│                             │
│ 시급 13,500원                │
│                             │
│ 4등급 · 여 · 보행가능        │
│                             │
│ 마감 09.30     조회 128      │
└─────────────────────────────┘
```

매칭 점수가 있는 경우:

```text
우측 상단 또는 카드의 명확한 영역에

매칭 92%
```

를 표시한다.

---

# 12. JobListItem

목록형 UI에서는:

```text
JobListItem
```

을 사용한다.

정보:

```text
배지
시설명
시설유형
직종
지역
근무형태
급여
등록일
조회수
스크랩
```

표 형태처럼 너무 촘촘하게 만들지 않는다.

행간과 좌우 padding을 충분히 확보한다.

---

# 13. SpecialJobCard

컴포넌트:

```text
SpecialJobCard
```

일반 JobCard보다 시각적 강조를 높인다.

그러나:

* 과도한 gradient
* 큰 이미지
* 강한 그림자
* 지나치게 큰 배지

를 사용하지 않는다.

Accent `#B9612F`를 사용한다.

---

# 14. TalentCard

인재정보 카드:

```text
TalentCard
```

정보:

```text
이름
성별
연령
희망직종
희망지역
자격증
갱신일
```

예:

```text
김영희 · 여성 · 56세

요양보호사

서울 강남구 · 서울 송파구

요양보호사 자격증
치매전문교육 이수

최근 갱신 2026.09.04
```

개인정보는 필요한 범위에서만 표시한다.

---

# 15. TalentDetail

연락처가 공개되지 않은 상태에서는:

```text
010-****-1234
```

와 같은 마스킹 형태를 사용한다.

시설회원의 권한이나 포인트에 따라
연락처 확인 UI를 제공할 수 있도록 구조를 분리한다.

---

# 16. SearchBar

컴포넌트:

```text
JobSearchBar
```

필드:

```text
지역
구/군
직종
시설유형
키워드
검색
```

Desktop에서는 가로 배치한다.

Mobile에서는:

```text
2열 또는 1열
```

로 자연스럽게 변경한다.

검색 버튼은 primary button을 사용한다.

---

# 17. FilterPanel

구인공고 목록 좌측 필터:

```text
지역
직종
시설유형
근무형태
고용형태
어르신 조건
급여
```

하단:

```text
필터 초기화
```

필터 그룹 사이에 충분한 vertical spacing을 사용한다.

---

# 18. Checkbox Group

직종:

```text
요양보호사
간병인
가사도우미
```

시설유형:

```text
방문요양
요양원
주야간보호
입주요양
```

Checkbox를 너무 작은 크기로 만들지 않는다.

---

# 19. SegmentedControl

구인공고 등록에서 사용:

```text
자립
부분도움
와상
```

또는:

```text
남성
여성
무관
```

선택된 상태:

```text
Primary #2C7A68
```

선택되지 않은 상태:

```text
White
Border #DDE7E4
```

---

# 20. Tag / Chip

업무 항목:

```text
세면
목욕
배설
체위변경
이동
식사준비
청소
세탁
말벗
병원동행
산책
```

선택 전:

```text
White + Border
```

선택 후:

```text
Primary Light + Primary
```

Chip은 정보를 그룹화할 때만 사용한다.

모든 텍스트를 chip으로 만들지 않는다.

---

# 21. JobDetail Layout

구인공고 상세 페이지:

```text
1200px
```

기본:

```text
main 1fr
sidebar 340px
```

sidebar:

```text
position: sticky
top: 적절한 header offset
```

---

# 22. JobDetail Sections

좌측:

```text
Job Header

근무조건

어르신 정보

자격요건

상세 내용

근무지
```

우측:

```text
시설 정보

온라인 지원하기

전화하기

매칭 점수
```

섹션마다 명확한 heading을 사용한다.

---

# 23. ElderlyInfoCard

정보:

```text
장기요양등급
성별
연령대
거동
식사
인지 상태
```

아이콘 + 텍스트 형태를 사용한다.

예:

```text
등급
4등급

성별
여성

연령
80대

거동
보행 가능
```

---

# 24. JobCreate Form

구인공고 등록은 단계형 UI다.

```text
① 기본정보
② 근무조건
③ 어르신 정보
④ 노출 옵션
⑤ 미리보기
```

현재 단계는 명확하게 Primary로 표시한다.

완료 단계:

```text
Primary
```

현재 단계:

```text
Primary + 강조
```

미완료:

```text
Neutral
```

---

# 25. JobCreate Step 3

현재 화면:

```text
③ 어르신 정보
```

필드:

```text
장기요양등급
성별
연령대
거동 상태
식사 상태
인지 상태
업무 항목
특이사항
```

각 상태 선택은 SegmentedControl을 우선 사용한다.

---

# 26. Live Preview

입력값이 변경되면 우측 미리보기 카드에 반영한다.

미리보기는:

```text
JobCard
```

를 최대한 재사용한다.

별도의 전혀 다른 카드 디자인을 만들지 않는다.

---

# 27. Exposure Option Modal

노출 옵션:

```text
일반
500P

프리미엄
7일
+1,000P

스페셜
7일
+3,000P
```

현재 잔액:

```text
보유 포인트 12,500P
```

안내:

```text
내용 수정은 언제든 무료,
목록 상단 노출은 끌어올리기(200P) 사용
```

유료 옵션은 Accent 색상을 사용한다.

---

# 28. Pagination

기본:

```text
이전
1
2
3
4
5
...
다음
```

현재 페이지:

```text
Primary
```

나머지:

```text
White
Border
```

페이지 번호를 지나치게 작게 만들지 않는다.

---

# 29. Modal

Modal:

```text
width: 480~600px
background: white
border-radius: 12px
padding: 24~32px
```

배경 overlay는 과도하게 어둡게 만들지 않는다.

---

# 30. Toast

성공:

```text
공고가 임시저장되었습니다.
```

스크랩:

```text
공고를 스크랩했습니다.
```

오류:

```text
필수 항목을 확인해주세요.
```

짧고 명확한 한국어를 사용한다.

---

# 31. Empty State

데이터가 없을 때:

```text
조건에 맞는 공고가 없습니다.
검색 조건을 변경해보세요.
```

불필요한 대형 일러스트를 사용하지 않는다.

---

# 32. Mock Data Rules

초기 개발에서는 실제 API 대신 mock data를 사용할 수 있다.

mock data는 별도 파일에 관리한다.

예:

```text
src/data/mock/jobs.ts
src/data/mock/talents.ts
src/data/mock/facilities.ts
```

컴포넌트 내부에 긴 데이터를 직접 작성하지 않는다.

---

# 33. TypeScript Rules

API 데이터와 UI 데이터 타입을 구분한다.

예:

```ts
type Job = {
  id: string;
  title: string;
  facilityName: string;
  salary: string;
};
```

컴포넌트 props는 명시적인 타입을 사용한다.

가능하면:

```text
any
```

사용을 피한다.

---

# 34. Component Reuse Rules

다음 상황에서는 기존 컴포넌트를 재사용한다.

```text
같은 UI가 2회 이상 등장
→ 컴포넌트화 검토

같은 UI가 3회 이상 등장
→ 컴포넌트화 우선
```

예:

잘못된 방식:

```text
HomeJobCard
JobListCard
SimilarJobCard
RecommendedJobCard
```

가 모두 동일한 구조라면 각각 새로 만들지 않는다.

가능하면:

```text
JobCard
```

를 사용하고 variant로 차이를 처리한다.

---

# 35. Variant Rules

variant는 시각적 차이가 명확한 경우에만 사용한다.

예:

```tsx
<JobCard variant="default" />
<JobCard variant="recommended" />
<JobCard variant="special" />
```

variant가 5~6개 이상으로 늘어나기 시작하면
컴포넌트 구조를 다시 검토한다.

---

# 36. Do Not Over-Componentize

다음과 같이 의미 없는 컴포넌트를 만들지 않는다.

```text
JobCardTitle
JobCardSalary
JobCardLocation
JobCardDate
JobCardText
```

단순한 텍스트까지 무조건 컴포넌트화하지 않는다.

독립적인 UI 규칙이나 재사용성이 있을 때만 분리한다.

---

# 37. Styling Rules

Tailwind CSS를 사용한다.

디자인 토큰을 우선한다.

예:

```text
bg-primary
text-primary
border-border
bg-surface
text-text-primary
```

컴포넌트마다 임의의 hex 색상을 직접 작성하지 않는다.

나쁜 예:

```tsx
<div className="bg-[#2C7A68]">
```

가능하면:

```tsx
<div className="bg-primary">
```

를 사용한다.

---

# 38. Responsive Rules

Desktop에서:

```text
max-width: 1200px
```

를 유지한다.

Mobile에서는:

```text
padding: 16px
```

정도를 기본으로 한다.

카드가 화면 밖으로 넘치지 않도록 한다.

가로 스크롤은 꼭 필요한 경우가 아니면 사용하지 않는다.

---

# 39. Accessibility Rules

모든 버튼은 실제 button element를 사용한다.

링크는 anchor 또는 Router Link를 사용한다.

클릭 이벤트를 div에 직접 부여하지 않는다.

Icon-only button:

```tsx
<button aria-label="공고 스크랩">
```

처럼 접근 가능한 이름을 제공한다.

---

# 40. Performance

이미지는 가능한 경우:

```text
WebP
```

또는

```text
SVG
```

를 사용한다.

불필요한 대형 이미지를 사용하지 않는다.

페이지 전체를 하나의 거대한 컴포넌트로 만들지 않는다.

---

# 41. Page Implementation Rules

페이지 구현 순서:

```text
1. Layout
2. Section
3. Component
4. Data
5. Interaction
6. Responsive
7. Visual refinement
```

처음부터 모든 기능을 구현하지 않는다.

먼저 목업과 동일한 시각적 구조를 만든다.

---

# 42. Visual QA

페이지 구현 후 반드시 확인한다.

### Layout

* 1440px에서 콘텐츠 폭이 1200px인가?
* Header가 동일한가?
* Footer가 동일한가?
* Section 간격이 일정한가?

### Typography

* 본문이 충분히 큰가?
* 제목 hierarchy가 명확한가?
* 작은 글씨가 과도하지 않은가?

### Components

* 카드 radius가 동일한가?
* 버튼 높이가 동일한가?
* 배지 스타일이 동일한가?
* 아이콘 스타일이 동일한가?

### UX

* 주요 CTA가 명확한가?
* 정보가 너무 빽빽하지 않은가?
* 40~60대 사용자가 읽기 쉬운가?

---

# 43. Claude Code Working Rule

화면을 구현하기 전에 반드시:

```text
1. DESIGN_SYSTEM.md 읽기
2. COMPONENT_RULES.md 읽기
3. 기존 components 확인
4. 기존 styles 확인
5. 기존 페이지 확인
```

순서로 확인한다.

이미 존재하는 컴포넌트를 먼저 재사용한다.

---

# 44. Prohibited Behavior

Claude Code는 다음 행동을 하지 않는다.

* 목업과 다른 디자인을 임의로 제안
* 새로운 색상 추가
* 새로운 gradient 추가
* 새로운 font 추가
* 기존 카드 radius 변경
* 기존 Header 재디자인
* 기존 Button 재디자인
* 페이지마다 다른 배지 스타일 생성
* 임의의 icon library 추가
* emoji 사용
* lorem ipsum 사용
* 불필요한 animation 추가
* 과도한 shadow 추가
* 모든 요소를 pill 형태로 변경
* 화면을 과도하게 카드화

---

# 45. Exception Rule

새로운 UI가 정말 필요하다면 먼저 기존 디자인 시스템과
컴포넌트로 표현할 수 있는지 확인한다.

기존 컴포넌트로 해결할 수 없는 경우에만
새로운 컴포넌트를 만든다.

새로운 디자인 토큰이 필요한 경우에는
임의로 추가하지 말고 전체 디자인 시스템과의 일관성을 먼저 검토한다.

---

# 46. Final Principle

컴포넌트의 목표는

"코드를 예쁘게 만드는 것"

이 아니라

"케어매치 전체 화면에서 동일한 경험을 만드는 것"

이다.

사용자가 메인에서 본 버튼과
구인공고 상세에서 본 버튼과
구인공고 등록에서 본 버튼은

같은 서비스의 버튼처럼 보여야 한다.

사용자가 메인에서 본 공고 카드와
구인공고 목록에서 본 공고와
비슷한 공고에서 본 공고 역시

같은 디자인 언어를 가져야 한다.

**한 화면의 완성도보다 전체 서비스의 일관성을 우선한다.**
