# 케어매치 디자인 시스템

> 케어매치(CareMatch) 웹 서비스의 전체 UI/UX 디자인 기준을 정의한다.
>
> 이 문서는 Claude Code가 화면을 구현할 때 임의로 디자인을 재해석하지 않도록
> 색상, 타이포그래피, 간격, 컴포넌트, 레이아웃, 반응형, 정보 계층을 일관되게 유지하는 것을 목적으로 한다.

---

# 1. 디자인 철학

케어매치는 요양보호사와 요양시설을 연결하는 채용·매칭 서비스다.

핵심 디자인 키워드는 다음과 같다.

- 신뢰감
- 따뜻함
- 편안함
- 전문성
- 가독성
- 접근성
- 안정감
- 과하지 않은 친절함

특히 주요 사용자 중 요양보호사의 상당수가 40~60대이므로
작은 글씨와 작은 클릭 영역을 지양한다.

## 디자인 목표

"복잡한 채용 게시판"이 아니라

> **누구나 쉽게 읽고, 원하는 일자리를 빠르게 찾을 수 있는
> 신뢰감 있는 돌봄 일자리 플랫폼**

을 목표로 한다.

---

# 2. 디자인 우선순위

화면 구현 시 다음 우선순위를 따른다.

1. 접근성 및 사용성
2. 화면별 공식 목업
3. 본 디자인 시스템
4. COMPONENT_RULES.md
5. 기존 구현 코드
6. 개발자의 임의적인 디자인 판단

단, 화면별 목업에서 본 디자인 시스템과 명확하게 다른 디자인이 지정된 경우
**해당 화면의 목업을 우선한다.**

목업에서 명시적으로 변경된 규칙은 해당 화면의 공식 디자인 예외로 간주한다.

---

# 3. 브랜드 컬러

## Primary

```text
Primary
#2C7A68

Primary Dark
#1F6255

Primary Light
#EAF5F2
```

용도:

- 주요 CTA
- 브랜드 강조
- 선택된 상태
- 링크
- 주요 아이콘
- 매칭 강조
- Header / Footer 브랜드 요소

---

## Accent

```text
Accent
#B9612F

Accent Light
#F8EDE5
```

용도:

- 스페셜 공고
- 프리미엄 공고
- 중요하지만 Primary보다 우선순위가 낮은 강조
- 보조 CTA

Accent는 화면 전체에 과도하게 사용하지 않는다.

---

## Background

```text
Page Background
#F7F7F4

Surface
#FFFFFF
```

전체 페이지는 따뜻한 아주 옅은 회백색을 기본 배경으로 사용한다.

카드와 패널은 White Surface를 사용한다.

---

## Text

```text
Text Primary
#263332

Text Secondary
#61706D

Text Muted
#87938F
```

본문은 충분한 대비를 확보한다.

---

## Border

```text
Border
#DDE7E4

Border Strong
#C8D5D1
```

카드와 입력창은 그림자보다 Border를 우선한다.

---

## Semantic Colors

```text
Success
#2C7A68

Warning
#B9612F

Danger
#C94A4A

Info
#4F7180
```

색상만으로 상태를 전달하지 않는다.

텍스트, 배지, 아이콘 등의 보조 정보를 함께 사용한다.

---

# 4. Typography

기본 폰트:

```text
Pretendard
Noto Sans KR
sans-serif
```

가능하면 Pretendard Variable을 사용한다.

## Font Scale

```text
Display
32px / 700

Page Title
30px / 700

Section Title
24px / 700

Sub Title
20px / 700

Card Title
18px / 700

Body Large
18px / 400

Body
16px / 400

Body Medium
16px / 500

Caption
14px / 400

Meta
13px / 400
```

## 중요 규칙

일반 사용자에게 노출되는 본문 텍스트는 **16px 미만으로 사용하지 않는다.**

13px은 날짜, 등록일, 보조 메타 정보 등
정보 우선순위가 낮은 데이터에만 사용한다.

다음 크기는 사용하지 않는다.

```text
10px
11px
12px
```

특히 Badge, 버튼, 주요 네비게이션 텍스트를 지나치게 작게 만들지 않는다.

---

# 5. Spacing

기본 8px spacing system을 사용한다.

```text
4
8
12
16
20
24
32
40
48
64
80
```

가능하면 임의의 6px, 10px 등의 값을 반복적으로 만들지 않는다.

단, 아이콘과 텍스트 사이의 미세한 조정처럼
시각적으로 필요한 경우에 한해 예외적으로 허용한다.

---

# 6. Container

Desktop:

```text
max-width: 1200px
margin: 0 auto
```

좌우 기본 여백:

```text
24px
```

대형 화면에서도 콘텐츠가 무한히 늘어나지 않도록 한다.

---

# 7. Grid

기본 Desktop Grid:

```text
4 columns
```

카드 기반 콘텐츠는 콘텐츠 성격에 따라 다음을 사용한다.

```text
추천 공고       4열
최신 인재정보   4열
스페셜 공고     3열
```

Tablet:

```text
2~3 columns
```

Mobile:

```text
1 column
```

화면별 목업에서 명시된 열 수를 우선한다.

---

# 8. Radius

```text
Card
10px

Input / Button
8px

Badge
6px

Modal
12px
```

기본적으로 모든 요소를 과도하게 둥글게 만들지 않는다.

특히 다음 스타일을 지양한다.

- 모든 카드가 완전한 pill 형태
- 모든 버튼이 capsule 형태
- 지나치게 큰 radius
- SaaS형 과도한 둥근 UI

단, 기능적으로 의미가 있는 상태 표시에는 예외를 허용한다.

---

# 9. Shadow

그림자는 매우 약하게 사용한다.

기본적으로:

> Border 기반 UI > Shadow 기반 UI

를 우선한다.

카드는 기본적으로 Border를 사용한다.

강한 box-shadow,
유리 느낌,
3D 느낌,
floating card 느낌은 사용하지 않는다.

---

# 10. Icon

아이콘은 **Lucide React**를 기본 아이콘 소스로 사용한다.

스타일:

- Outline
- 단순함
- 1.5~2px stroke
- 장식 목적의 아이콘 남용 금지

이모지 아이콘을 UI 아이콘으로 사용하지 않는다.

---

# 11. Button

주요 CTA:

```text
Primary
#2C7A68
```

Hover:

```text
#1F6255
```

Secondary:

```text
White
Border #C8D5D1
```

버튼은 최소 44px 이상의 클릭 영역을 확보한다.

주요 버튼 텍스트는:

```text
16px / 500~600
```

을 기본으로 한다.

---

# 12. Input / Select

기본:

```text
Height: 48px
Radius: 8px
Border: #DDE7E4
Background: #FFFFFF
```

Focus:

```text
Primary 기반 focus 상태
```

Label을 숨기지 않고 필요한 경우 명시적으로 표시한다.

특히 검색/필터 UI에서 Placeholder만으로 입력 목적을 전달하지 않는다.

---

# 13. Card

기본 카드:

```text
Background: #FFFFFF
Border: #DDE7E4
Radius: 10px
Shadow: 최소화
```

카드는 정보 밀도를 낮추고
명확한 정보 계층을 유지한다.

카드 안에 모든 정보를 넣으려고 하지 않는다.

---

# 14. Badge

기본 Badge:

```text
font-size: 14px
font-weight: 500~600
radius: 6px
```

## Job Status Badge

공고 상태는 다음 스타일을 사용한다.

### 스페셜

```text
Background: #B9612F
Text: #FFFFFF
```

### 프리미엄

```text
Background: #FFFFFF
Border: #B9612F
Text: #B9612F
```

### 새글

```text
Background: #2C7A68
Text: #FFFFFF
```

### 일반

```text
Background: #EAF5F2
Text: #2C7A68
```

### 마감임박

```text
Background: #C94A4A
Text: #FFFFFF
```

## 화면별 예외

메인 화면의 최신 구인공고 TABLE에서는
위 5종 상태 배지를 모두 표시한다.

따라서 기존의

> 일반 공고는 배지를 표시하지 않는다.

규칙은 메인 TABLE에서는 적용하지 않는다.

다른 화면에서 별도 규칙이 존재하는 경우
해당 화면의 명시적인 목업/규칙을 따른다.

---

# 15. Matching Score

매칭 점수는 케어매치의 핵심 기능 정보다.

메인 화면에서는 다음과 같이 표시한다.

```text
매칭 92%
매칭 88%
매칭 85%
매칭 82%
```

## 스타일

모든 점수는 동일한 Primary 계열을 사용한다.

```text
Background: #2C7A68
Text: #FFFFFF
```

둥근 pill 형태를 사용한다.

### 중요 예외

일반적인 디자인 시스템에서는 과도한 pill 사용을 금지하지만,
**매칭 점수는 기능적으로 하나의 수치형 상태를 강조하는 UI이므로 pill을 허용한다.**

점수에 따라 색상을 다르게 하지 않는다.

예:

```text
92% → Green
88% → Yellow
82% → Orange
```

와 같은 등급형 색상 체계를 사용하지 않는다.

---

# 16. Main Search

메인 화면 검색 영역은 Hero와 분리한다.

구조:

```text
Hero
↓
Search Panel
```

Hero 내부에 검색창을 넣지 않는다.

## 검색 필드

다음 5개를 사용한다.

```text
지역
구·군
직종
시설유형
키워드
```

각 필드는 상단 Label을 표시한다.

예:

```text
지역
[ 서울특별시        ▼ ]

구·군
[ 강남구            ▼ ]
```

키워드는 입력창을 사용한다.

검색 버튼은 Primary Deep 스타일을 사용한다.

---

## 보조 검색 기능

검색 필드 아래에 다음 두 버튼을 배치한다.

```text
내 주변 일자리 찾기
구인공고 알림받기
```

둘 다 Outline 스타일을 기본으로 한다.

---

# 17. Main Hero

Hero는 검색 기능을 포함하지 않는다.

구조:

```text
좌측
리드 카피
메인 제목

중앙
보조 설명

우측
요양보호사 + 어르신 일러스트
```

예시 카피:

```text
좋은 일자리, 더 나은 내일을 위해

요양 인력과 시설을 연결하는
케어매치
```

배경은 따뜻한 연녹색 → 크림 계열의
아주 약한 배경 그라데이션을 사용할 수 있다.

단, 강한 색상 그라데이션은 사용하지 않는다.

Hero radius:

```text
10px
```

---

# 18. Main Recommended Jobs

메인 맞춤 공고는 **4열**이다.

섹션 제목:

```text
김영희님께 맞는 공고
```

제목 오른쪽에는 짧은 설명을 인라인으로 배치한다.

예:

```text
김영희님께 맞는 공고
님의 희망조건과 가장 잘 맞는 일자리예요.
```

## 카드 정보 구조

```text
[매칭 92%] [지역 일치] [시간대 일치]        [스페셜]

시설명
시설유형

직종

지역
근무형태 | 급여

등록일
```

카드에는 기본적으로 다음을 넣지 않는다.

- 하트 스크랩 버튼
- 과도한 태그
- 불필요한 그림자
- 불필요한 장식

---

# 19. Special Jobs

스페셜 채용정보는 **3열**이다.

전체 섹션에는 매우 옅은 Primary Light 계열의
배경 영역을 사용한다.

카드는 White Surface 기반이다.

카드 구조:

```text
좌측
상태 Badge
시설명
공고 제목
지역
근무형태
급여

우측
시설 사진
짧은 홍보 문구
```

사진은 대략:

```text
90 × 70px
```

수준의 영역을 확보한다.

실제 이미지가 없는 경우에도
최종 이미지가 들어갈 영역의 크기를 유지한다.

---

# 20. Latest Jobs

메인에서는 최신 구인공고를 **TABLE 하나로만 표시한다.**

스페셜 채용정보와 동일한 공고를
별도의 3열 카드로 다시 표시하지 않는다.

따라서 메인 구조에서 다음 형태는 사용하지 않는다.

```text
스페셜 채용정보
↓
최신 구인공고 카드 3개
↓
최신 구인공고 TABLE
```

대신:

```text
스페셜 채용정보
↓
최신 구인공고 TABLE
```

로 구성한다.

## Table Columns

```text
상태
시설명
직종
지역
근무형태
급여
등록일
```

헤더는 아주 옅은 회색/Primary Light 계열 배경을 사용한다.

행은 지나치게 촘촘하게 만들지 않는다.

---

# 21. Latest Talent

최신 인재정보는 **4열 카드**다.

카드 구성:

```text
원형 프로필 이미지

이름
성별 · 나이

희망 직종

지역

자격증

갱신일
```

메인 화면에서는 다음 정보를 표시하지 않는다.

- 매칭 점수
- 급여
- 스크랩 버튼
- 불필요한 태그

## 개인정보

목업에서는 실제 이름처럼 보이는 데이터를 사용할 수 있지만,
실제 공개 서비스에서는 필요한 범위에서 마스킹한다.

예:

```text
김정회
→
김정○
```

전화번호 등 직접적인 연락처는 공개하지 않는다.

---

# 22. Region Shortcut

지역별 바로가기는 한 줄 기반으로 자연스럽게 wrap한다.

예:

```text
서울
경기
인천
부산
대구
대전
광주
울산
세종
강원
충북
충남
전북
전남
경북
경남
제주
```

버튼은 가벼운 Outline / White Surface 기반으로 구성한다.

과도하게 큰 pill은 사용하지 않는다.

---

# 23. Notice

공지사항은 최대 3개를 메인에 노출한다.

구조:

```text
공지사항

공지 제목                         날짜
공지 제목                         날짜
공지 제목                         날짜
```

날짜는 13px Meta 스타일을 사용한다.

공지 데이터는 컴포넌트 내부에 하드코딩하지 않고
mock data 또는 실제 API 데이터로 분리한다.

---

# 24. Customer Service

고객센터 영역은 공지사항과 2열로 구성한다.

표시 정보:

```text
고객센터

1588-1234

평일 09:00 ~ 18:00
점심시간 12:00 ~ 13:00

카카오톡 상담하기
help@carematch.co.kr

[1:1 문의하기]
```

전화번호는 다른 정보보다 시각적으로 크게 표시한다.

---

# 25. Header

Desktop Header 구조:

```text
로고 + 세로 구분선 + 2줄 태그라인

구인공고
인재정보
내 주변 일자리
구직신청
고객센터

글자크기
[기본] [크게] [더크게]

로그인
회원가입
```

## Tagline

로고 옆에 세로 구분선을 두고
2줄의 짧은 태그라인을 표시한다.

예:

```text
사람과 사람을 이어주는
요양 일자리 플랫폼
```

## Font Size Control

기본적으로 상시 노출되는 세그먼트 형태를 사용한다.

```text
[기본] [크게] [더크게]
```

드롭다운으로 대체하지 않는다.

선택 상태:

```text
Primary
#2C7A68
```

비선택 상태:

```text
White
Border
```

---

# 26. Footer

Footer는 Dark Green 기반이다.

구조:

```text
좌측
케어매치 로고
태그라인

중앙
회사소개
이용약관
개인정보처리방침
고객센터

우측
1588-1234
카카오톡
help@carematch.co.kr
Copyright
```

배경은 Primary Dark 계열을 사용한다.

텍스트는 White 또는 낮은 대비의 White 계열을 사용한다.

Footer는 SiteLayout의 공용 컴포넌트로 구현한다.

---

# 27. Main Page Final Structure

메인 페이지의 공식 구조는 다음과 같다.

```text
Header
│
├── Hero Banner
│
├── Search Panel
│
├── Recommended Jobs
│   └── 4 columns
│
├── Special Recruitment
│   └── 3 columns
│
├── Latest Jobs
│   └── Table
│
├── Latest Talents
│   └── 4 columns
│
├── Region Shortcut
│
├── Notice + Customer Service
│   └── 2 columns
│
└── Footer
```

## 금지되는 중복 구조

다음 구조는 사용하지 않는다.

```text
Special Jobs
↓
Latest Job Cards
↓
Latest Job Table
```

Latest Job은 Table 하나로 통일한다.

---

# 28. Responsive

Breakpoints:

```text
Mobile
< 768px

Tablet
768px ~ 1023px

Desktop
>= 1024px
```

기준 모바일 폭:

```text
390px
```

## Mobile

Desktop 4열:

```text
4 → 1
```

Desktop 3열:

```text
3 → 1
```

검색 패널:

```text
Desktop
5 fields horizontal

Mobile
필드 vertical stack
```

Header:

```text
Desktop Navigation
→
Mobile Menu
```

필터/검색의 복잡한 UI는 필요한 경우 Drawer를 사용한다.

---

# 29. Touch Target

모바일에서 터치 가능한 요소는 최소:

```text
44 × 44px
```

이상을 확보한다.

특히:

- 버튼
- 링크
- 아이콘 버튼
- 체크박스
- 검색
- 모바일 메뉴

는 충분한 터치 영역을 확보한다.

---

# 30. Accessibility

다음 원칙을 지킨다.

- 충분한 색상 대비
- 키보드 접근 가능
- focus 상태 제공
- 아이콘 버튼 aria-label 제공
- 이미지 alt 제공
- 색상만으로 상태 전달하지 않음
- 클릭 영역 최소 44px
- 폰트 크기를 지나치게 작게 만들지 않음

---

# 31. Animation

애니메이션은 최소화한다.

기본 transition:

```text
150~200ms
```

허용:

- hover
- focus
- 버튼 상태 변화
- drawer
- modal
- 간단한 opacity 변화

금지:

- 과도한 scroll animation
- 지속적으로 움직이는 장식
- bounce 효과 남용
- 화려한 page transition

---

# 32. Image Asset Rules

현재 실제 이미지 에셋이 존재하지 않는 경우
placeholder를 사용할 수 있다.

단, placeholder 때문에 최종 디자인의 구조가 변경되어서는 안 된다.

예:

```text
Hero illustration
→ 실제 이미지 영역과 동일한 크기 유지

Special Job image
→ 실제 사진 영역과 동일한 크기 유지

Talent profile
→ 원형 프로필 영역과 동일한 크기 유지
```

추후 실제 이미지로 교체하기 쉽게
컴포넌트와 데이터에서 이미지 경로를 분리한다.

---

# 33. Empty / Loading

Empty State와 Loading State도
전체 디자인 시스템과 동일한 typography와 spacing을 사용한다.

불필요하게 큰 일러스트나 장식은 사용하지 않는다.

---

# 34. Data / UI Separation

컴포넌트 안에 긴 mock 데이터를 직접 작성하지 않는다.

예:

```text
src/data/mock/jobs.ts
src/data/mock/talents.ts
src/data/mock/notices.ts
```

와 같이 데이터를 분리한다.

UI 컴포넌트는 데이터 구조를 받아 렌더링하는 역할에 집중한다.

---

# 35. Component Reuse

기존 공용 컴포넌트가 존재하면 우선 재사용한다.

예:

```text
Button
Input
Select
Badge
JobBadge
FacilityBadge
MatchingScore
SectionHeader
Pagination
Tag
Modal
Drawer
Toast
EmptyState
LoadingState
```

단, 메인 목업과 다른 이유만으로
기존 공용 컴포넌트를 무조건 변경하지 않는다.

변경이 다른 화면에서도 올바른 변경인지 먼저 판단한다.

메인에서만 필요한 스타일이면
variant 또는 page-level composition을 우선한다.

---

# 36. Component Creation Rule

한 화면에서 한 번만 사용하는 단순 UI를
무조건 별도의 컴포넌트 파일로 분리하지 않는다.

반복되거나 향후 여러 화면에서 재사용될 가능성이 높은 UI만
공용 컴포넌트로 분리한다.

예:

```text
Section
→ 여러 화면에서 반복되므로 컴포넌트화

Notice 데이터
→ data/mock으로 분리

Region Shortcut
→ 단순 반복 데이터 + 기존 region 데이터 재사용
```

---

# 37. Forbidden Visual Style

다음 스타일은 사용하지 않는다.

## 색상

- 보라색 중심 디자인
- 파란색 중심 SaaS 디자인
- 강한 네온 색상
- 과도한 그라데이션
- 무지개색 UI

단, 메인 Hero의 아주 약한
연녹색 → 크림색 배경 전환은 허용한다.

## 스타일

- AI SaaS 느낌
- 미래형 UI
- Gaming UI
- Luxury UI
- 과도하게 귀여운 UI
- 과도하게 기업형인 UI
- Glassmorphism
- Neumorphism
- 과도한 3D
- 과도한 그림자
- 모든 요소를 pill로 만드는 디자인
- 카드가 화면 전체를 뒤덮는 과밀한 레이아웃

---

# 38. Information Density

케어매치는 정보를 많이 제공하지만
정보를 한 화면에 무작정 압축하지 않는다.

원칙:

```text
정보량 ↓
가독성 ↑
```

사용자가 가장 먼저 읽어야 하는 정보:

```text
공고 제목
직종
시설명
지역
근무형태
급여
```

그 다음:

```text
매칭률
공고 상태
등록일
기타 조건
```

---

# 39. Main Mockup Fidelity

메인 화면 구현 시 `capture/메인.png`를
공식 시각적 기준으로 사용한다.

단순히 "비슷한 느낌"으로 구현하지 않는다.

다음 항목을 목업과 비교한다.

```text
전체 섹션 순서
콘텐츠 최대 너비
Hero 높이
Search Panel 높이
섹션 간 간격
카드 열 수
카드 높이
텍스트 계층
폰트 크기
색상
Border
Radius
버튼 크기
이미지 영역
Table 구조
Footer 구조
```

목업에 없는 요소를 개발자가 임의로 추가하지 않는다.

예:

```text
불필요한 하트
불필요한 태그
불필요한 통계
불필요한 배너
불필요한 그래프
불필요한 floating button
```

---

# 40. Main Screen State

메인 목업은 기본적으로
**로그인한 개인회원 상태**를 기준으로 구현한다.

예:

```text
김영희님께 맞는 공고
```

Header 역시 로그인 후 상태를 기준으로 한다.

예:

```text
포인트
알림
김영희 ▼
```

로그아웃 상태의 별도 홈 화면 분기는
메인 1차 구현 범위에서 제외한다.

추후 인증 상태와 연결하면서 추가한다.

---

# 41. Design System Change Policy

기존 디자인 시스템을 수정해야 하는 경우
다음 기준을 따른다.

## 전 화면에 올바른 변경

공용 디자인 시스템을 수정한다.

예:

```text
잘못된 font size
잘못된 spacing
잘못된 기본 border
```

## 특정 화면에만 필요한 변경

전역 토큰을 변경하지 않는다.

예:

```text
Main의 Matching Score pill
Main Table의 일반 Badge
Main의 Hero 배경
```

이러한 경우에는 화면별 variant 또는 composition을 사용한다.

---

# 42. Final Principle

케어매치의 UI는

> **"많이 보여주는 사이트"가 아니라
> "읽기 쉬운 사이트"**

를 지향한다.

그리고

> **"AI가 만든 것처럼 화려한 디자인"보다
> "사람이 신뢰할 수 있는 서비스 디자인"**

을 우선한다.

모든 화면에서 일관된 색상, typography, spacing, 정보 계층을 유지한다.

개발자는 목업에 없는 디자인을 임의로 추가하지 않는다.

목업과 디자인 시스템이 충돌할 경우,
**해당 화면에서 명시적으로 정의된 목업의 디자인을 우선한다.**
