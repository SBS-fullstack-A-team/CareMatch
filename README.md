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

- **회원** — 구직회원 / 시설회원 / 보호자회원(GENERAL, 구직 의사 없이 개인적으로 요양보호사를 찾는 소비자 계정) 3종 + 관리자, 아이디·비밀번호 로그인(JWT), 소셜 로그인(카카오 — 백엔드는 네이버·구글도 지원하는 3사 공용 구조지만 프론트는 카카오만 노출), 로그인 실패 잠금, 비밀번호 찾기(이메일/휴대폰 인증코드 기반 재설정), 회원 탈퇴
- **구인공고** — 등록·수정·마감, 목록·상세, 추천순/최신순 정렬, 내 주변 일자리(반경 검색 + 지도 클러스터링), 임시저장, 스크랩
- **인재정보** — 구직자 프로필, 인재 검색, 공고↔인재 매칭도 계산
- **인증구직자 마크** — 구직자가 승인된 자격증·경력인증을 각 1건 이상 보유하면 마크 신청 가능, 관리자 최종 승인 시 부여. 인재 목록/상세에 마크 표시
- **구직신청** — 공고 상세에서 온라인으로 지원 / 취소 / 수락·반려
- **포인트** — 보호자회원·시설회원·관리자가 사용하는 실제 잔액 컬럼. 공고 등록(노출옵션 포함)·인재 연락처 열람 시 차감, **포트원(PortOne) V2 결제로 실제 충전** — 서버가 결제 금액/상태를 포트원 서버 API로 재조회해 검증(클라이언트 위변조 방지)
- **알림** — 지원 결과(합격/반려)·시설 승인/반려·문의 답변 시점에 서버가 알림을 생성, 헤더 배지 폴링(30초 주기)으로 안읽음 표시. 실시간 푸시/이메일은 아직 없음
- **관리자 대시보드** — 회원 검색, 포인트 충전 내역, 시설 승인/반려(+사업자등록증 열람), 1:1 문의 답변, 공지사항 CRUD
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
| 결제 | 포트원(PortOne) V2 — 포인트 충전. 서버가 결제 결과를 재조회해 검증, 클라이언트가 보낸 값은 신뢰하지 않음 |
| 지도 | 카카오맵 SDK — 내 주변 일자리(반경 검색 + 클러스터링) |

## 팀원

| 이름 | GitHub | 역할 |
|---|---|---|
| 혁 (팀장) | [@heo-hyuk](https://github.com/heo-hyuk) | 백엔드 |
| 신영 | [@syyu21b](https://github.com/syyu21b) | 프론트엔드 |
| 경수 | [@HurKyungsoo](https://github.com/HurKyungsoo) | 백엔드 |
| 동한 | [@Kim-dong-han](https://github.com/Kim-dong-han) | 프론트엔드 |

## 팀원별 작업 내역

커밋 히스토리(9/7 프로젝트 시작 ~ 9/16) 기준 파트별 주요 작업 요약.

### 혁 (팀장 · 백엔드 · [@heo-hyuk](https://github.com/heo-hyuk))
- **초기 셋업**: 모노레포 구조(`backend/`·`frontend/` 분리) 전환, CODEOWNERS·PR 자동 리뷰어 지정, GitHub Flow 협업 규칙(`CLAUDE.md`), CI(GitHub Actions 빌드체크)
- **회원/인증**: 회원·인증·보안·고객센터 도메인, JWT 로그인, CORS 설정, 카카오 소셜 로그인 단일화(네이버/구글 숨김), 비밀번호 찾기 API, 회원 탈퇴 API
- **인프라/배포**: Render 배포 안정화(포트 바인딩, 스키마 검증, `@Lob`→`oid` 컬럼 문제), Flyway 마이그레이션 도입, Cloudflare R2 파일 스토리지
- **알림/관리자**: 알림 도메인(지원 결과/시설 승인/문의 답변) + 헤더 배지 폴링, 관리자 인재 연락처 마스킹 해제
- **버그 수정**: 결제/포인트 동시요청 이중 처리, 문의 답변 등록 응답 null id
- **문서화**: README·트러블슈팅 문서 지속 관리

### 신영 (프론트엔드 · [@syyu21b](https://github.com/syyu21b))
- **회원 플로우**: 회원가입(보호자/구직/시설 3단계, GENERAL role), 마이페이지, 약관·개인정보처리방침, 회사소개, 고객센터 콘텐츠
- **구인공고**: 목록/상세/홈/검색·필터(facets) 실 API 연동, "공고에 지원하기" 액션 + 등록/수정 폼
- **인재정보/구직신청**: 인재정보 목록/상세, 구직신청 실 API 연동
- **관리자**: 관리자 페이지(회원/포인트충전/시설/문의/공지 관리) 구현
- **포인트/결제**: 포인트 충전 UI + 포트원(PortOne) 연동(구매자 이메일/휴대폰 전달, 미보유 시 입력창), 더미 데이터 대량 시딩
- **UI 개선**: 모바일 반응형 수정(가로 스크롤/텍스트 넘침, 스페셜 채용정보 카드 넘침, 포인트 충전 결제창 모바일 리다이렉트 에러, 마이페이지/관리자 페이지 진입 경로 보완)

### 경수 (백엔드 · [@HurKyungsoo](https://github.com/HurKyungsoo))
- **구인공고**: 등록/목록/상세/수정/삭제, 다중조건 검색·정렬·노출등급, 스크랩, 비슷한 공고, 매칭 스코어 계산
- **구직신청/인재정보**: Application 도메인, 인재 검색 + 인재↔공고 매칭도, 구직자 프로필 필드 확장
- **공통 enum 정리**: 직종/근무시간대/고용형태/시설유형/자격증종류 통일 + `ENUM_MAPPING.md` 문서화
- **내 주변 일자리**: nearby 반경검색 API, 지도+리스트+카카오맵, 반경 실시간 추적/클러스터링/드래그, 마커 공유(카카오톡/링크), 프리미엄 공고 강조
- **보안/접근제어**: 인재 이름 마스킹 서버측 강제, 인재정보 접근 게이트(승인 시설회원·관리자 전용)
- **인증구직자 마크**: 자격증 관리자 심사, 경력인증, 마크 신청/승인 도메인 신설(백엔드)
- **버그 수정**: 구인공고 지역 표시 중복(예: "전북익산시 익산시")

### 동한 (프론트엔드 · [@Kim-dong-han](https://github.com/Kim-dong-han))
- **초기 셋업**: 프론트엔드 프로젝트 초기화 + 홈 화면
- **페이지 구현**: 구인공고 목록/상세, 인재정보 목록/상세, 회원가입, 구직신청, 고객센터, 내 주변 일자리
- **UX 개선**: 상단 메뉴 회원 유형별 재설정, 관리자 계정 구직신청 화면 열람 허용, 회원가입 휴대폰 번호 하이픈 자동입력
- **인증구직자 마크**: 프론트 연동 — 구직자 신청 화면, 관리자 심사 화면, 인재 목록/상세 마크 표시

## 브랜치 전략 (GitHub Flow)

- `main` — 통합 + 배포 브랜치. 직접 push 금지, PR로만 병합
- `feature/*` — 기능 브랜치. `main`에서 분기 → `main`으로 PR
  - 백엔드: `feature/be-기능명`
  - 프론트엔드: `feature/fe-기능명`
- 배포 시점은 `main`에 git 태그(`vX.Y.Z`)로 표시
- `main` push 시 Render / Vercel 자동 배포
- PR을 열거나 갱신하면 GitHub Actions가 자동으로 빌드/타입체크를 돈다(`.github/workflows/ci-frontend.yml`, `ci-backend.yml`) — `frontend/`, `backend/` 변경분에 각각 반응

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

### 8. main 브랜치 빌드 깨짐 — 병합 충돌 잔여물이 그대로 커밋됨 (`2cae4b1`)
- **증상**: PR 머지 후 `main`의 프론트 빌드가 실패. 파일 안에 `<<<<<<<`/`=======`/`>>>>>>>` 마커 텍스트와 양쪽 브랜치 코드가 그대로 섞여 커밋돼 있었음(중복 import, 존재하지 않는 변수 참조, JSX 구조 깨짐).
- **원인**: 기능 브랜치가 `main`의 리팩터링 이전 시점에서 갈라진 상태로 오래 유지되다 머지되면서, git의 라인 기반 diff가 무관한 섹션에 코드를 잘못 이어붙임. 사람이 병합 충돌 마커를 실수로 안 지우고 그대로 커밋.
- **해결**: 두 브랜치의 머지 베이스를 찾아 3-way merge를 다시 재현하고, 양쪽 의도를 살려 수동으로 병합. 재발 방지책은 트러블슈팅 #10(CI) 참고.

### 9. 카카오 로그인 Redirect URI 등록 위치 — 콘솔 UI 개편으로 이동
- **증상**: "카카오 로그인 > 고급" 메뉴에 로그인용 Redirect URI 등록란이 없음(로그아웃 리다이렉트 URI만 있어서 처음엔 그쪽에 잘못 등록함).
- **해결**: 로그인용 Redirect URI는 **[앱] > [플랫폼 키] > REST API 키 카드** 안의 "카카오 로그인 리다이렉트 URI" 항목에 등록해야 함. Client Secret 발급/활성화도 같은 카드 안에 있음. 참고로 `account_email` 동의항목은 사업자등록증이 없어도 "개인 개발자 본인인증"으로 신청 가능하지만 카카오 심사(수일)가 필요해서, 승인 전까지는 `profile_nickname`만 쓰고 이메일이 없으면 `OAuthAttributes.emailOrPlaceholder()`가 임시 이메일을 채워주도록 처리(`a5c734b`).

### 10. CI 부재로 병합 충돌 잔여물 머지 사고 반복 (`62e83e8`)
- **증상**: 트러블슈팅 #8과 같은 유형의 사고가 과거에도 한 번 더 있었음(PR #84). 둘 다 자동 검사가 전혀 없어서 사람이 직접 화면/코드를 열어보기 전까진 `main`이 깨진 걸 아무도 몰랐음.
- **해결**: `.github/workflows/ci-frontend.yml`(`npm ci` → `lint` → `tsc -b` → `build`), `ci-backend.yml`(`./gradlew build`, 테스트 포함) 추가. `pull_request` 트리거 + `paths` 필터로 관련 있는 변경에만 반응해서 평소엔 조용하고, PR에서 빌드가 깨지면 그 자리에서 바로 표시됨.

### 11. 로컬 프론트 → 배포 백엔드(Render) 호출 시 CORS 403
- **증상**: 프론트를 로컬(`localhost:5173`)에서 띄우고 API base URL 을 배포된 Render 백엔드로 잡으면, 회원가입 등 API 호출이 CORS 로 막힘. 프론트 쪽 설정(`.env.local` 등)은 다 맞아도 재현됨.
- **원인**: Render 의 `CORS_ALLOWED_ORIGINS` 환경변수가 Vercel 도메인만 화이트리스트로 등록돼 있어서(`docs/BACKEND.md` 참고 — 와일드카드 금지, 화이트리스트만 허용), `localhost` 는 배포 백엔드 기준으로 허용 origin 이 아님. 코드나 로컬 설정 문제가 아니라 **서버(Render) 쪽 화이트리스트 문제**.
- **해결(둘 중 하나)**:
  1. 백엔드를 로컬로 직접 실행(`cd backend && ./gradlew bootRun`) 후 프론트가 `http://localhost:8080` 을 바라보게 설정. 로컬 백엔드 기본 CORS 설정엔 `localhost:5173`/`3000` 이 이미 포함돼 있어 바로 동작.
  2. Render 환경변수 `CORS_ALLOWED_ORIGINS` 에 `http://localhost:5173` 을 콤마로 추가(Render 대시보드 → 서비스 → Environment). 대시보드 접근 권한이 있는 사람만 가능.

### 12. 동시요청 시 이중 처리 — 예외를 catch해도 `UnexpectedRollbackException` (`4c2779c`)
- **증상**: 포인트 충전 완료(`complete`)·인재 연락처 열람·구인공고 스크랩처럼 "확인(존재 여부/상태) → 부수효과(포인트 차감·적립, DB 저장) → 저장" 순서인 로직에서, 두 번째 저장이 unique 제약 위반으로 실패할 때 그 예외를 `catch`해서 조용히 넘어가는 방식으로 동시요청을 처리하고 있었음. 동시성 재현 테스트(같은 인재를 8개 스레드로 동시에 열람)를 돌려보니 `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only` 발생.
- **원인**: Hibernate 는 flush 가 한 번이라도 실패하면, 애플리케이션 코드가 그 예외를 catch해서 무시하더라도 **해당 트랜잭션 전체를 rollback-only 로 표시**해버린다. 메서드 자체는 정상적으로 return 되지만, 스프링이 커밋을 시도하는 순간 "이 트랜잭션은 롤백하기로 되어 있었다"며 대신 롤백하고 `UnexpectedRollbackException` 을 던진다 — catch 블록이 있어도 실제로는 요청 하나가 처리되지 않은 예외로 끝나는 상태였음.
- **해결**: unique 제약/예외 catch에 기대는 대신, 관련 회원(Member) row 에 비관적 락(`SELECT ... FOR UPDATE`, `findByIdForUpdate`)을 걸어서 "확인 → 부수효과 → 저장" 구간 자체를 애초에 경쟁이 안 생기도록 직렬화. `PointChargeService.complete()`(같은 결제건 이중 적립 방지), `ContactUnlockService.unlock()/grantFreeAccess()`(연락처 열람 이중 차감 방지), `ScrapService.scrap()`(찜하기 중복 클릭) 세 곳 모두 동일 패턴으로 수정. `ContactUnlockServiceConcurrencyTest` 로 회귀 테스트 추가 — 수정 전 코드로는 이 테스트가 실제로 실패함을 확인.

### 13. 포인트 스키마가 Flyway 마이그레이션 없이 운영에 먼저 반영됨 (`e92e5b5`)
- **증상**: 포트원 결제 연동 PR 이 `Member.point` 컬럼과 `point_charge` 테이블을 새로 추가했는데, 같은 PR에 마이그레이션 파일(`V*.sql`)을 포함하지 않았음. `ddl-auto: validate` 인 운영에서 스키마가 없으면 기동 자체가 실패해야 하는데, 실제로는 배포가 정상 동작 중이었음 — 어떤 경로로든 운영 DB(Neon)에 스키마가 먼저 반영된 채로 git 에는 그 변경 이력이 없는 상태.
- **해결**: `V12__point_charge.sql` 을 사후 작성 — 운영에 이미 반영돼 있을 가능성을 고려해 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS` 로 전부 멱등하게 작성. H2 로 (1) 빈 DB에 `V1~V12` 순서대로 적용 (2) 컬럼/테이블이 이미 있는 상태에서 재실행 — 둘 다 에러 없이 통과함을 확인.
- **재발 방지**: 엔티티에 컬럼/테이블을 추가하는 PR은 반드시 같은 PR에 마이그레이션 파일을 포함할 것(위 "DB 스키마 / 마이그레이션" 섹션 참고).

### 14. 포인트 충전 실패 — PG사 주문번호 길이 제한 초과 (`1656b25`)
- **증상**: 포인트 충전 결제창은 정상적으로 뜨는데 결제 자체가 실패.
- **원인**: 결제 1건을 식별하는 `paymentId` 를 `"point-" + UUID.randomUUID()` 형태의 긴 문자열로 생성했는데, 일부 PG사는 주문번호(orderId) 길이에 제한을 둠 — 그 제한을 초과.
- **해결**: `paymentId` 길이를 PG사 주문번호 제한 이내로 축소.
