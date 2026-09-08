# CareMatch

요양보호사와 돌봄이 필요한 가정을 연결하는 매칭 웹 서비스입니다.

## 주요 기능

> 🚧 기획 진행 중 — 확정되는 대로 업데이트 예정

- (작성 예정)

## 기술 스택

| 구분 | 기술 | 배포 |
|---|---|---|
| 프론트엔드 | React | Vercel |
| 백엔드 | Spring Boot | Render |

## 팀원

| 이름 | GitHub | 역할 |
|---|---|---|
| Heo (팀장) | [@heo-hyuk](https://github.com/heo-hyuk) | 백엔드 |
| 신영 | [@syyu21b](https://github.com/syyu21b) | 프론트엔드 |
| 경수 | [@HurKyungsoo](https://github.com/HurKyungsoo) | 백엔드 |
| 동한 | [@Kim-dong-han](https://github.com/Kim-dong-han) | 프론트엔드 |

## 브랜치 전략 (GitHub Flow)

- `main` — 통합 + 배포 브랜치. 직접 push 금지, PR로만 병합
- `feature/*` — 기능 브랜치. `main`에서 분기 → `main`으로 PR
  - 백엔드: `feature/be-기능명`
  - 프론트엔드: `feature/fe-기능명`
- 배포 시점은 `main`에 git 태그(`vX.Y.Z`)로 표시

자세한 협업 규칙은 [`CLAUDE.md`](./CLAUDE.md) 참고.

## 저장소 구조

```
CareMatch/
├── backend/     # Spring Boot API 서버 (Render 배포)
├── frontend/    # React 앱 (Vercel 배포) — 예정
├── docs/        # API / ERD / 백엔드 문서
├── .github/     # CODEOWNERS, 워크플로우
└── CLAUDE.md    # 협업 규칙
```

## 시작하기

```bash
git clone https://github.com/SBS-fullstack-A-team/CareMatch.git
cd CareMatch

# 백엔드 (JDK 17+ 필요, 로컬은 H2 인메모리라 별도 DB 세팅 불필요)
cd backend && ./gradlew bootRun

# 프론트엔드 (예정)
# cd frontend && npm install && npm run dev
```

- 백엔드는 IntelliJ 로 열 때 `backend/` 를 Gradle 프로젝트로 임포트한다.
- 프론트 개발 서버는 `http://localhost:5173`(Vite) / `http://localhost:3000` 기준으로 백엔드 CORS 가 열려 있다.

## 트러블슈팅

지금까지 겪고 해결한 이슈 기록. (괄호 안은 관련 커밋)

### 1. 로컬 빌드 실패 — JDK 버전 & Gradle wrapper 누락 (`64f9ada`)
- **증상**: JDK 17 이 없는 로컬(예: JDK 21)에서 `./gradlew build` 실패. wrapper 가 커밋되지 않아 clone 직후 빌드 불가.
- **해결**: `build.gradle` 의 Java toolchain(17 고정) 제거 → `options.release = 17` 로 전환(17 바이트코드는 유지). Gradle wrapper(jar·스크립트·properties) 커밋. `.gitattributes` 로 `gradlew`=LF / `gradlew.bat`=CRLF 고정(Mac/Linux 팀원 대응).

### 2. Spring 컨텍스트 로딩 실패 — SecurityConfig 순환참조 (`a1b1f0d`)
- **증상**: `SecurityConfig → OAuth2SuccessHandler → AuthService → PasswordEncoder(@Bean, SecurityConfig 내부)` 로 자기 자신으로 돌아오는 순환참조. `BeanCurrentlyInCreationException` 으로 `contextLoads` 테스트 실패, `bootRun` 기동 불가.
- **해결**: `PasswordEncoder` 빈을 의존성 없는 별도 클래스 `PasswordConfig` 로 분리해 고리를 끊음. `AuthenticationManager` 빈은 순환 경로가 아니라 그대로 유지.

### 3. CORS — 프론트 연동 안 됨 (`8e1f8e9`)
- **증상**: Vercel 프리뷰 배포(`carematch-*.vercel.app`)처럼 서브도메인이 매번 바뀌어 고정 origin 목록으로는 차단됨. 로컬 Vite 포트(5173)도 미허용.
- **해결**: `setAllowedOrigins` → `setAllowedOriginPatterns`(패턴 허용)로 변경. 로컬 origin 에 `http://localhost:5173` 추가(3000 유지). `.env.example` 도 패턴 형식으로 갱신.

### 4. 모노레포 전환에 따른 경로 조정 (`0246862`)
- **증상**: 백엔드를 `backend/` 하위로 이동하면서 배포·IDE 경로가 어긋남.
- **해결**: Render 의 Root Directory 를 `backend` 로 변경. IntelliJ 는 `backend/` 를 Gradle 프로젝트로 재임포트. `.gitignore` 의 wrapper jar 예외 경로를 `**/` 로 일반화.
