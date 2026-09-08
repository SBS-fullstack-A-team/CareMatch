# CareMatch Design System

> 케어매치(CareMatch) 전체 프론트엔드의 시각적 디자인 기준이다.
>
> 이 문서는 화면별 디자인보다 우선한다.
> 새로운 화면을 구현할 때 기존 디자인 규칙을 임의로 변경하지 않는다.

---

# 1. Design Philosophy

## 브랜드 방향

케어매치는 요양보호사·간병인·가사도우미와 요양시설을 연결하는 구인구직 + 매칭 플랫폼이다.

핵심 브랜드 이미지는 다음 세 가지다.

* 신뢰감
* 따뜻함
* 전문성

의료/복지 서비스의 안정적인 분위기를 유지하되,
기존 요양 구인구직 사이트의 오래된 게시판 느낌은 제거한다.

---

## Visual Keywords

DO:

* Clean
* Warm
* Trustworthy
* Professional
* Calm
* Accessible
* Human
* Practical

DON'T:

* Futuristic
* Tech startup
* Luxury
* Gaming
* Excessively cute
* Excessively corporate
* AI-generated SaaS aesthetic

---

# 2. Color System

## Primary

```text
Primary          #2C7A68
Primary Dark     #1F6255
Primary Light    #EAF5F2
```

사용처:

* 주요 CTA
* 활성 상태
* 링크
* 선택 상태
* 매칭 관련 핵심 UI
* 브랜드 강조

Primary 색상을 화면 전체에 과도하게 사용하지 않는다.

---

## Accent

```text
Accent           #B9612F
Accent Light     #F8EDE5
```

사용처:

* 스페셜 공고
* 프리미엄 공고
* 유료 노출
* 중요한 강조 요소

Accent는 Primary와 경쟁할 정도로 많이 사용하지 않는다.

---

## Neutral

```text
Background       #F7F7F4
Surface          #FFFFFF

Text Primary     #263332
Text Secondary   #61706D
Text Muted       #87938F

Border           #DDE7E4
Border Strong    #C8D5D1
```

페이지 전체 배경은 기본적으로 `#F7F7F4`를 사용한다.

콘텐츠 영역과 카드는 `#FFFFFF`를 사용한다.

---

## Semantic Colors

```text
Success          #2C7A68
Warning          #B9612F
Danger           #C94A4A
Info             #4F7180
```

상태를 색상 하나만으로 전달하지 않는다.

아이콘, 텍스트, 배지 등의 보조 정보를 함께 제공한다.

---

# 3. Typography

## Font

Primary:

```text
Pretendard
```

Fallback:

```text
"Noto Sans KR"
sans-serif
```

---

## Font Scale

```text
Display        32px / 700
Page Title     30px / 700
Section Title  24px / 700
Sub Title      20px / 700
Card Title     18px / 700

Body Large     18px / 400
Body           16px / 400
Body Medium    16px / 500

Caption        14px / 400
Meta           13px / 400
```

---

## Typography Rules

본문은 기본 16px 이하로 내리지 않는다.

40~60대 사용자가 많은 서비스이므로
가독성을 우선한다.

금지:

```text
10px
11px
12px
```

위 크기를 일반적인 정보 표시용으로 사용하지 않는다.

13px은 조회수, 등록일, 수정일 등
보조적인 메타 정보에 한정한다.

---

# 4. Line Height

```text
Heading        1.3
Body           1.6
Small          1.5
```

한국어 텍스트가 많은 화면에서는
줄 간격을 충분히 확보한다.

---

# 5. Spacing System

8px 기반 spacing system을 사용한다.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
80px
```

주요 사용 기준:

```text
컴포넌트 내부 기본 여백      16px
카드 내부 여백               20~24px
카드 간격                    16px
섹션 간격                    40~64px
페이지 좌우 여백             24px
```

임의의 `13px`, `17px`, `23px` 등의 값을 반복적으로 만들지 않는다.

정말 필요한 경우에만 예외를 허용한다.

---

# 6. Layout

## Desktop

기준 화면:

```text
1440px
```

콘텐츠 최대 폭:

```text
1200px
```

페이지 중앙 정렬:

```text
margin: 0 auto;
```

---

## Main Container

```text
max-width: 1200px
width: calc(100% - 48px)
```

Desktop에서는 콘텐츠 좌우 여백을 충분히 확보한다.

---

# 7. Grid

## 4 Column

메인 추천 공고 / 인재정보 등에 사용한다.

```text
repeat(4, 1fr)
```

---

## 3 Column

스페셜 채용정보 등에 사용한다.

```text
repeat(3, 1fr)
```

---

## 2 Column

상세 페이지 등에 사용한다.

예:

```text
main content 1fr
sidebar 340px
```

---

## Job List

구인공고 목록 페이지:

```text
filter 260px
content 1fr
```

---

# 8. Border Radius

전체적으로 절제된 radius를 사용한다.

```text
Card       10px
Input       8px
Button      8px
Badge       6px
Modal      12px
```

금지:

```text
border-radius: 24px;
border-radius: 9999px;
```

모든 요소를 pill 형태로 만들지 않는다.

단, 선택 칩이나 태그처럼 의미적으로 pill이 적합한 UI에는 제한적으로 사용한다.

---

# 9. Border

기본:

```text
1px solid #DDE7E4
```

카드는 기본적으로 border를 사용한다.

border와 shadow를 동시에 강하게 사용하지 않는다.

---

# 10. Shadow

그림자는 매우 약하게 사용한다.

Default:

```text
0 1px 3px rgba(0, 0, 0, 0.05)
```

Hover:

```text
0 4px 12px rgba(0, 0, 0, 0.08)
```

강한 그림자:

```text
0 10px 30px rgba(...)
```

사용 금지.

---

# 11. Buttons

## Primary Button

```text
background: #2C7A68
color: #FFFFFF
border-radius: 8px
font-weight: 600
```

사용:

* 검색
* 온라인 지원하기
* 다음
* 저장
* 회원가입

---

## Secondary Button

```text
background: #FFFFFF
color: #263332
border: 1px solid #DDE7E4
border-radius: 8px
```

---

## Accent Button

```text
background: #B9612F
color: #FFFFFF
```

사용:

* 스페셜
* 프리미엄
* 유료 노출

등에 제한한다.

---

# 12. Input

기본:

```text
height: 44px
border: 1px solid #DDE7E4
border-radius: 8px
background: #FFFFFF
font-size: 16px
```

Focus:

```text
border-color: #2C7A68
box-shadow: 0 0 0 3px rgba(44, 122, 104, 0.12)
```

placeholder는 실제 입력값보다 시각적으로 약하게 표현한다.

---

# 13. Select

Input과 동일한 높이와 radius를 사용한다.

```text
height: 44px
font-size: 16px
border-radius: 8px
```

아이콘은 Lucide의 `ChevronDown`을 사용한다.

---

# 14. Badge

## Special

```text
background: #B9612F
color: #FFFFFF
```

## Premium

```text
background: #FFFFFF
color: #B9612F
border: 1px solid #B9612F
```

## New

```text
background: #EAF5F2
color: #2C7A68
```

## Closing Soon

```text
background: #FBEAEA
color: #C94A4A
```

배지는 짧고 명확한 단어를 사용한다.

---

# 15. Card

기본 카드:

```text
background: #FFFFFF
border: 1px solid #DDE7E4
border-radius: 10px
```

padding:

```text
20px
```

카드 안에서 정보의 hierarchy를 명확하게 만든다.

예:

```text
Badge

시설명
직종 제목

지역
근무시간

급여

어르신 정보

마감일 / 조회수
```

---

# 16. Job Card

공고 카드의 핵심 정보:

1. 배지
2. 시설명
3. 시설유형
4. 직종
5. 지역
6. 근무요일
7. 근무시간
8. 급여
9. 어르신 조건
10. 마감일
11. 조회수
12. 스크랩
13. 매칭점수

급여는 카드에서 가장 눈에 띄는 정보 중 하나로 만든다.

---

# 17. Matching Score

매칭 점수는 케어매치의 핵심 UI다.

예:

```text
92%
88%
85%
82%
```

표현:

```text
매칭 92%
```

또는 원형/게이지 형태를 사용할 수 있다.

단, 매칭 점수가 화면마다 다른 스타일로 등장하지 않도록
`MatchingScore` 컴포넌트를 사용한다.

매칭 사유:

```text
지역 일치
시간대 일치
급여 조건 충족
희망 직종 일치
시설 유형 일치
```

---

# 18. Icon

Lucide React를 사용한다.

기본 아이콘:

```text
Search
MapPin
Heart
Bell
User
Building2
Phone
Share2
Flag
Clock
Calendar
ChevronDown
ChevronRight
SlidersHorizontal
Check
X
```

기본 크기:

```text
16px
18px
20px
24px
```

아이콘을 장식 목적으로 과도하게 사용하지 않는다.

---

# 19. Header

모든 Desktop 페이지에서 동일한 Header를 사용한다.

구조:

```text
Logo
│
구인공고
인재정보
내 주변 일자리
구직신청
고객센터
│
글자크기
로그인
회원가입
```

로그인 후:

```text
포인트
알림
프로필
```

Header를 페이지마다 새로 구현하지 않는다.

---

# 20. Footer

Footer는 모든 페이지에서 동일한 구조를 사용한다.

내용:

```text
회사정보
이용약관
개인정보처리방침
고객센터
전화
카카오톡
이메일
```

---

# 21. Responsive

Breakpoints:

```text
Mobile    < 768px
Tablet    768px ~ 1023px
Desktop   >= 1024px
```

주요 모바일 기준:

```text
390px
```

---

## Mobile Rules

Desktop의 2열 구조:

```text
main + sidebar
```

는 모바일에서:

```text
main
sidebar
```

순으로 변경한다.

필터 패널은 Drawer로 변경한다.

4열 카드는:

```text
1열
```

로 변경한다.

3열 카드는:

```text
1열
```

로 변경한다.

---

# 22. Accessibility

버튼과 입력 요소의 클릭 영역을 충분히 확보한다.

권장 최소 터치 영역:

```text
44px × 44px
```

색상 대비를 확보한다.

색상만으로 상태를 표현하지 않는다.

아이콘에는 필요한 경우 aria-label을 제공한다.

---

# 23. Animation

애니메이션은 최소화한다.

권장:

```text
150~200ms
ease-out
```

사용:

* hover
* modal
* drawer
* dropdown

금지:

* 과도한 parallax
* 화면 전체 애니메이션
* 의미 없는 bounce
* 지속적인 움직임
* 과도한 hover effect

---

# 24. Visual Consistency Rules

화면이 달라져도 다음은 동일해야 한다.

```text
Header
Footer
Button
Input
Select
Badge
Card
Typography
Color
Spacing
Icon
Border Radius
Shadow
```

새로운 화면을 만들 때 새로운 스타일을 발명하지 않는다.

기존 컴포넌트를 먼저 찾는다.

---

# 25. Final Principle

케어매치는 "예쁜 웹사이트"보다

"신뢰할 수 있고 읽기 쉬운 실제 서비스"

를 목표로 한다.

디자인을 더 화려하게 만드는 것이 개선이 아니다.

정보가 명확해지고,
사용자가 쉽게 찾고,
쉽게 이해하고,
쉽게 지원할 수 있게 만드는 것이 디자인의 최우선 목표다.
