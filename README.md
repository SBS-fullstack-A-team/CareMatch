# CareMatch

요양보호사·간병인·가사도우미와 요양시설을 연결하는 구인구직 매칭 웹 서비스입니다.

## 배포 / 접속 주소

| 대상 | URL | 비고 |
|---|---|---|
| 서비스 (프론트) | https://care-match-lake.vercel.app | Vercel |
| API 서버 (백엔드) | https://carematch-gtke.onrender.com | Render (무료 인스턴스 — 최초 요청 시 콜드스타트 수십 초) |
| 헬스체크 | https://carematch-gtke.onrender.com/actuator/health | `{"status":"UP"}` |

> 로컬 개발 중에는 프론트가 `.env.local` 의 `VITE_API_BASE_URL` 로 백엔드를 가리킨다. 배포 환경변수는 각 대시보드(Vercel / Render)에서 관리한다.

## 주요 기능

> 🚧 개발 진행 중. 백엔드 API 기준으로 구현된 범위:

- **회원** — 구직자 / 시설 회원가입, 아이디·비밀번호 로그인(JWT), 소셜 로그인(네이버·카카오·구글), 로그인 실패 잠금
- **구인공고** — 등록·수정·마감, 목록·상세, 추천순/최신순 정렬, 내 주변 일자리(반경 검색), 임시저장, 스크랩
- **인재정보** — 구직자 프로필, 인재 검색, 공고↔인재 매칭도 계산
- **구직신청** — 지원 / 취소 / 수락·반려
- **고객센터** — 공지, FAQ, 1:1 문의
- **파일 업로드** — presigned URL 기반 (자격증·사업자등록증·프로필 사진·공고 이미지)
- **접근성** — 쉬운 화면 모드 / 글자 크기(기기 + 서버 동기화)

API 상세는 [`docs/API.md`](./docs/API.md), 데이터 모델은 [`docs/ERD.md`](./docs/ERD.md) 참고.

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React 19 · Vite · TypeScript · Tailwind CSS · React Router — **Vercel** 배포 |
| 백엔드 | Spring Boot 3 · Spring Security(JWT/OAuth2) · Spring Data JPA — **Render** 배포 (Docker) |
| DB | PostgreSQL — **Neon** (로컬은 H2 인메모리) |
| 스키마 마이그레이션 | Flyway (`prod` 자동 적용, `local`/`test` 는 H2 `create-drop`) |
| 파일 스토리지 | Cloudflare R2 (S3 호환, presigned URL) — 로컬은 stub |

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
- `main` push 시 Render / Vercel 자동 배포

자세한 협업 규칙은 [`CLAUDE.md`](./CLAUDE.md) 참고.

## 저장소 구조

```
CareMatch/
├── backend/     # Spring Boot API 서버 (Render 배포)
│   └── src/main/resources/db/migration/   # Flyway 마이그레이션 (V1, V2, ...)
├── frontend/    # React 앱 (Vercel 배포)
├── docs/        # API / ERD / 백엔드 / 마이그레이션 문서
├── .github/     # CODEOWNERS, 워크플로우
└── CLAUDE.md    # 협업 규칙
```

## 시작하기

```bash
git clone https://github.com/SBS-fullstack-A-team/CareMatch.git
cd CareMatch
```

### 백엔드 (JDK 17+ 필요)

```bash
cd backend
./gradlew bootRun        # 로컬은 H2 인메모리 + Flyway 비활성 → 별도 DB 세팅 불필요
```

- IntelliJ 로 열 때는 `backend/` 를 Gradle 프로젝트로 임포트한다 (루트를 열면 인식 안 됨).
- 운영 환경변수 예시는 [`backend/.env.example`](./backend/.env.example).

### 프론트엔드 (Node 20+ 권장)

```bash
cd frontend
npm install
cp .env.example .env.local   # VITE_API_BASE_URL 설정 (로컬 백엔드면 http://localhost:8080)
npm run dev                  # http://localhost:5173
```

- 백엔드 CORS 는 `http://localhost:5173`(Vite) / `http://localhost:3000` 을 허용한다.
- 로컬 백엔드를 안 띄우면 `.env.local` 의 `VITE_API_BASE_URL` 을 배포 API 주소로 두면 된다.

## DB 스키마 / 마이그레이션

- `prod` 는 앱 기동 시 Flyway 가 `backend/src/main/resources/db/migration/V*.sql` 을 자동 적용한다.
- 엔티티(컬럼·테이블) 변경 시 `V{다음번호}__설명.sql` 파일을 같은 PR 에 추가하면 배포 때 반영된다. **이미 배포된 `V*.sql` 은 수정 금지.**
- 자세한 절차는 [`docs/MIGRATION.md`](./docs/MIGRATION.md).

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

### 5. Render 배포 실패 — 포트 바인딩 (`1c54fc0`)
- **증상**: `No open ports detected` 로 배포 실패. Render 는 `$PORT` 로 동적 포트를 주입하는데 그 포트로 리스닝하는지 확인함.
- **해결**: `application.yml` 에 `server.port: ${PORT:8080}` 추가(로컬은 8080 유지). Dockerfile `ENTRYPOINT` 의 중복 `-Dserver.port` 제거, `exec` 로 SIGTERM 전달 개선.

### 6. Render 배포 실패 — 스키마 검증 & `@Lob` → `oid` (`1c54fc0`, `1d079dd`, `389551f`)
- **증상 1**: `Schema-validation: missing table [...]`. 운영 DB(Neon)가 비어 있는데 `prod` 는 `ddl-auto: validate`.
- **증상 2**: `Faq.answer` 등 `@Lob String` 필드가 Hibernate 6 + PostgreSQL 에서 `text` 가 아닌 `oid` 컬럼으로 생성 → 문자열 insert/조회가 깨짐 (H2 로컬에선 안 드러남).
- **해결**: `@Lob` → `@Column(columnDefinition = "TEXT")`. 그리고 **Flyway 도입** — `prod` 는 기동 시 `db/migration/V*.sql` 을 자동 적용(`baseline-on-migrate` 로 기존 스키마 위에 얹음), `local`/`test` 는 비활성. 이후로 수동 `ALTER` 불필요.

### 7. Vercel 환경변수 — `VITE_` 공개 접두어 경고
- **증상**: Vercel 이 `VITE_API_BASE_URL` 에 대해 "public prefix 는 브라우저에 노출된다, Config 로 바꿔라" 경고 표시.
- **해결**: 무시. Vite 는 `VITE_` 접두어 변수만 클라이언트에 노출하므로 접두어가 **필수**다. 값이 공개 API URL 이라 노출돼도 안전(시크릿 아님). 시크릿은 애초에 프론트 환경변수에 두지 않는다.
