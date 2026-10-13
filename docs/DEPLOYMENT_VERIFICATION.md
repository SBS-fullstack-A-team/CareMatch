# CareMatch 배포 및 검증 보고서

> 작성일: 2026-10-06 · 검증 수행일: 2026-10-06
> 대상: 팀 프로젝트 애플리케이션 배포 및 검증
> 서비스 <https://care-match-lake.vercel.app> · API <https://carematch-gtke.onrender.com>

---

## 1. 프로젝트 개요와 구조

요양보호사·간병인·가사도우미와 요양시설/보호자를 연결하는 구인구직 매칭 웹 서비스다.
프론트엔드와 백엔드를 하나의 저장소에서 관리하는 **모노레포**로 구성하고, 두 영역을 서로 다른 플랫폼에 배포한다.

```
CareMatch/
├── frontend/   React 앱        → Vercel 배포
├── backend/    Spring Boot API → Render 배포 (Docker)
├── docs/       API · ERD · 배포 문서 (공용)
└── .github/    CI 워크플로 · CODEOWNERS
```

| 구분 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | React 19 · TypeScript · Vite · Tailwind CSS · React Router v7 | 빌드 산출물 정적 호스팅 |
| 백엔드 | Spring Boot 3 · Spring Security(JWT / OAuth2) · Spring Data JPA | 컨트롤러 27개 · 엔드포인트 98개 |
| 데이터베이스 | PostgreSQL (Neon) | 로컬은 H2 인메모리 |
| 스키마 마이그레이션 | Flyway (V1~V14) | `prod` 프로필에서만 활성 |
| 파일 스토리지 | Cloudflare R2 (S3 호환, presigned URL) | 로컬은 stub 구현체 |
| 결제 | 포트원(PortOne) V2 | 서버가 결제 결과를 재조회해 검증 |
| 지도 | 카카오맵 SDK | 반경 검색 · 주소 검색 |

---

## 2. 배포 환경 구성

### 2-1. 프론트엔드 — Vercel

| 항목 | 값 |
|---|---|
| Root Directory | `frontend` |
| 빌드 명령 | `npm run build` (= `tsc -b && vite build`) |
| 산출물 | `dist/` (정적 파일) |
| SPA 라우팅 | `frontend/vercel.json` 의 rewrite로 모든 경로를 `index.html` 로 전달 |

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

React Router가 클라이언트에서 경로를 처리하므로, 이 설정이 없으면 `/jobs/22` 같은 주소로 **직접 접속하거나 새로고침할 때 404**가 난다. 아래 §5에서 실제로 200이 반환되는 것을 확인했다.

### 2-2. 백엔드 — Render (Docker)

`backend/Dockerfile` 로 **멀티스테이지 빌드**를 구성해, 최종 이미지에는 JRE와 jar만 남긴다.

```dockerfile
FROM gradle:8.10.2-jdk17 AS build      # 빌드 스테이지
COPY build.gradle settings.gradle ./   # 의존성 캐시 레이어 분리
RUN gradle dependencies --no-daemon || true
COPY src ./src
RUN gradle clean bootJar --no-daemon -x test   # 테스트는 CI에서 수행

FROM eclipse-temurin:17-jre-jammy AS runtime   # 실행 스테이지
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring                              # 비루트 실행
COPY --from=build /workspace/build/libs/*.jar app.jar
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
```

배포 환경에 맞춰 조정한 지점은 세 가지다.

1. **포트** — Render가 주입하는 `$PORT` 를 그대로 쓴다. `application.yml` 의 `server.port: ${PORT:8080}` 이 처리하고, Dockerfile에서는 포트를 고정하지 않는다.
2. **종료 신호** — `exec` 로 java를 PID 1로 띄워, 재배포 시 보내는 `SIGTERM` 이 애플리케이션까지 전달되게 했다.
3. **헬스체크** — 컨테이너 레벨에서 `/actuator/health` 가 `"status":"UP"` 인지 30초 주기로 확인한다.

Render Root Directory는 모노레포 전환에 맞춰 `backend` 로 설정했다.

### 2-3. 데이터베이스 — Neon (PostgreSQL)

접속 정보는 소스에 두지 않고 Render 환경변수(`DB_URL` / `DB_USERNAME` / `DB_PASSWORD`)로 주입한다. 커넥션 풀 크기도 `DB_POOL_SIZE`(기본 5)로 환경에 맞게 조절할 수 있게 했다 — Neon 무료 플랜의 커넥션 수 제한을 고려한 값이다.

---

## 3. 개발 환경과 운영 환경의 설정 분리

### 3-1. Spring 프로필 분리

| | `local` | `prod` |
|---|---|---|
| 데이터베이스 | H2 인메모리 | PostgreSQL (Neon) |
| 스키마 생성 | `ddl-auto: create-drop` | `ddl-auto: validate` (Flyway가 관리) |
| Flyway | 비활성 | 활성 (`baseline-on-migrate: true`) |
| 더미 데이터 시더 | 항상 실행 | 기본 off (`SEED_MARKETPLACE_DUMMY`) |
| 로그 레벨 | `DEBUG` (SQL·Security 포함) | `INFO` |
| 프록시 헤더 | — | `forward-headers-strategy: framework` (Render 프록시 뒤 HTTPS 인식) |

공통 설정(`application.yml`)에는 **값이 아니라 키 이름과 기본값만** 둔다. 모든 민감값은 `${ENV_VAR}` 형태로 주입받고, 기본값은 로컬에서 외부 인프라 없이 뜨도록 하는 용도로만 쓴다.

### 3-2. 주요 환경변수 (값은 각 플랫폼 대시보드에서 관리)

| 대상 | 키 | 용도 |
|---|---|---|
| Render | `DB_URL` · `DB_USERNAME` · `DB_PASSWORD` | Neon 접속 |
| Render | `JWT_SECRET` · `JWT_ACCESS_TTL` · `JWT_REFRESH_TTL` | 토큰 서명·만료 |
| Render | `CORS_ALLOWED_ORIGINS` | 허용 origin 화이트리스트 |
| Render | `OAUTH_KAKAO_CLIENT_ID` · `..._SECRET` · `OAUTH_REDIRECT_BASE` | 소셜 로그인 |
| Render | `OAUTH_SUCCESS_REDIRECT` · `OAUTH_FAILURE_REDIRECT` | 로그인 후 프론트 복귀 주소 |
| Render | `STORAGE_PROVIDER` · `R2_ENDPOINT` · `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` | 파일 업로드 |
| Render | `PORTONE_STORE_ID` · `PORTONE_API_SECRET` | 결제 검증 (서버 전용) |
| Vercel | `VITE_API_BASE_URL` · `VITE_KAKAO_MAP_KEY` · `VITE_PORTONE_CHANNEL_KEY` | 프론트 런타임 설정 |

원칙 두 가지를 지켰다.

- **시크릿은 프론트 환경변수에 두지 않는다.** Vite는 `VITE_` 접두어가 붙은 값만 번들에 넣는데, 이 값들은 브라우저에서 그대로 보인다. 그래서 프론트에는 공개돼도 되는 값(API 주소, 지도 JS 키, 결제 채널 키)만 두고, 결제 검증용 `PORTONE_API_SECRET` 같은 비밀값은 서버 환경변수로만 관리한다.
- **CORS는 와일드카드 대신 화이트리스트.** `carematch.cors.allowed-origins` 를 환경변수로 주입하고, 운영에는 Vercel 도메인만 등록했다.

---

## 4. DB 스키마 관리 (Flyway)

운영 스키마는 Flyway 마이그레이션으로만 변경한다. 현재 **V1~V14**가 `backend/src/main/resources/db/migration/` 에 있다.

```
V1  baseline                 V8   jobposting_detail_fields
V2  member_display_preference V9  certificate_type
V3  jobtype_redefine         V10  general_member_role
V4  jobposting_work_schedule V11  notification
V5  facility_type            V12  point_charge
V6  jobseeker_desired_work_schedule  V13  verified_badge
V7  jobseeker_desired_region V14  career_verification_file
```

- 이미 스키마가 존재하던 Neon DB에 Flyway를 나중에 도입했으므로 `baseline-on-migrate: true` 로 V1을 "적용됨"으로 기록만 하고 V2부터 실행한다. 빈 DB(신규 환경)에서는 V1부터 순서대로 실행된다.
- 운영은 `ddl-auto: validate` 라서 **엔티티와 실제 테이블이 다르면 애플리케이션이 아예 기동하지 않는다.** 즉 서버가 떠 있다는 사실 자체가 스키마 검증 통과의 증거다.
- 엔티티에 컬럼/테이블을 추가하는 PR은 같은 PR에 마이그레이션 파일을 포함하는 것을 규칙으로 정했다(§7-6 사고의 재발 방지책).

---

## 5. 소스코드 검증

### 5-1. CI — PR 단위 자동 검증

`.github/workflows/` 에 두 개의 워크플로를 두고, `paths` 필터로 관련 변경이 있는 PR에서만 동작하게 했다.

| 워크플로 | 트리거 | 실행 단계 |
|---|---|---|
| `ci-frontend.yml` | `frontend/**` 변경 PR | `npm ci` → `npm run lint` → `npx tsc -b` → `npm run build` |
| `ci-backend.yml` | `backend/**` 변경 PR | `./gradlew build` (테스트 포함) |

CI는 **병합 충돌 잔여물이 그대로 머지돼 `main` 빌드가 깨진 사고**(§7-5)를 두 번 겪은 뒤 도입했다.

### 5-2. 로컬 빌드 검증 (2026-10-06 실행)

```
$ cd frontend && npm run build

> carematch@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
✓ 2015 modules transformed.
dist/index.html                         0.98 kB │ gzip:   0.56 kB
dist/assets/hero-banner-2wn9Al1H.png  362.86 kB
dist/assets/index-WsVuwOUC.css         46.17 kB │ gzip:   8.82 kB
dist/assets/index-CUj74NCm.js         689.19 kB │ gzip: 189.35 kB
✓ built in 281ms
```

- 타입 검사(`tsc -b`)와 번들 빌드 모두 오류 없이 통과했다.
- 경고가 하나 있다: JS 번들이 500 kB를 넘는다(689 kB / gzip 189 kB). 동작에는 문제가 없으나, 개선안은 §9에 적었다.
- 백엔드는 PR마다 CI에서 `./gradlew build`(테스트 포함)로 검증하고, 배포 시에는 Docker 빌드 스테이지에서 `gradle clean bootJar` 가 다시 수행된다.

---

## 6. 배포 결과 및 정상 동작 검증

아래는 **2026-10-06에 실제 배포된 서비스로 호출한 결과**다.

### 6-1. 배포 상태

| 확인 항목 | 결과 |
|---|---|
| 백엔드 헬스체크 `/actuator/health` | `{"status":"UP"}` |
| 배포 커밋 `/actuator/info` | `8d5478c` (branch `main`, repo `SBS-fullstack-A-team/CareMatch`) |
| 배포 커밋 ↔ `main` 차이 | `main` 이 12커밋 앞서 있으나 **`backend/` 변경은 0건** → 운영 백엔드 코드는 최신과 동일 |
| 프론트엔드 루트 `/` | HTTP 200 (0.48s) |
| 프론트엔드 딥링크 `/jobs/22`, `/mypage` | HTTP 200 → SPA rewrite 정상 |

배포된 커밋을 런타임에 확인할 수 있도록, Render가 주입하는 `RENDER_GIT_COMMIT` / `RENDER_GIT_BRANCH` 를 `/actuator/info` 로 노출해 두었다. **지금 떠 있는 서버가 어느 커밋인지** 대시보드 없이도 확인할 수 있다.

### 6-2. API 동작 확인

| 분류 | 호출 | 결과 |
|---|---|---|
| 공개 조회 | `GET /api/job-postings?page=0&size=1` | 200 · 전체 **102건** |
| 공개 조회 | `GET /api/support/notices?page=0&size=1` | 200 · 공지 1건 |
| 공개 조회 | `GET /api/support/faqs` | 200 |
| 공개 조회 | `GET /api/support/site-config` | 200 |
| 공개 조회 | `GET /api/job-postings/featured` | 200 |
| 없는 리소스 | `GET /api/job-postings/999999` | **404** (예외 처리 정상) |
| 인증 필요 | `GET /api/jobseekers/me` (토큰 없이) | **401** |
| 인증 필요 | `GET /api/members/me` (토큰 없이) | **401** |
| 인증 필요 | `GET /api/applications/me` (토큰 없이) | **401** |

공개 목록이 102건을 반환한다는 것은 **Render(API) → Neon(DB) 연결이 살아 있다는 뜻**이고, 토큰 없는 요청이 401로 막힌다는 것은 역할 기반 접근 제어가 배포 환경에서도 적용되고 있다는 뜻이다.

### 6-3. 프론트 ↔ 백엔드 연동 (CORS)

```
$ curl -i -X OPTIONS https://carematch-gtke.onrender.com/api/job-postings \
       -H "Origin: https://care-match-lake.vercel.app" \
       -H "Access-Control-Request-Method: GET"

HTTP/1.1 200 OK
access-control-allow-origin: https://care-match-lake.vercel.app
access-control-allow-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
access-control-allow-credentials: true
```

운영 도메인만 허용 목록에 있고, 프리플라이트가 정상 통과한다.

### 6-4. 주요 기능 동작 확인

브라우저에서 실제 배포/로컬 실행 화면으로 확인한 범위다. (캡처는 `presentation/screenshots/` 에 보관)

| 기능 | 확인 결과 |
|---|---|
| 회원가입 (보호자 / 구직 / 시설) | 3종 분기, 아이디·이메일 중복 확인, 약관 동의까지 동작. 시설은 "승인 대기" 상태로 접수됨 |
| 로그인 | 아이디·비밀번호 로그인 및 세션 유지 확인. 실패 5회 시 15분 잠금 설정 적용 |
| 조회 | 구인공고 목록(102건)·상세, 필터(지역 서울 적용 시 6건), 정렬 3종, 고객센터 공지·FAQ |
| 등록 | 구직신청(희망조건 등록) 저장 후 매칭 점수에 반영되는 것까지 확인 |
| 수정 | 마이페이지 프로필 수정 — 전체 덮어쓰기 API 특성상 기존 값 병합 후 저장되는 것 확인 |
| 삭제 | 지원 취소, 경력 인증 삭제 동작 확인 |
| 연동 기능 | 카카오맵 반경 검색(지도 렌더링·마커), 매칭 점수 계산(목록·상세·지원자) |

### 6-5. 성능 — 무료 인스턴스 콜드 스타트

| 호출 | 응답 시간 |
|---|---|
| 첫 호출(인스턴스 휴면 상태) | **120초 타임아웃 발생** (재요청 시 기동 완료) |
| 기동 후 재호출 | **0.98초** |

Render 무료 인스턴스는 일정 시간 요청이 없으면 휴면 상태로 전환되고, 다음 요청 때 컨테이너를 다시 띄운다. 기능 결함이 아니라 플랜 특성이며, 발표·시연 전에 **미리 한 번 호출해 깨워두는 것**으로 대응한다. 프론트에는 로딩 스켈레톤이 있어 화면이 깨지지는 않는다.

---

## 7. 배포 과정에서 발생한 오류와 해결

실제로 배포가 실패했거나 운영에서 드러난 문제들이다. (상세 기록은 `README.md` 트러블슈팅 절)

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | Render 배포 실패 — `No open ports detected` | Render가 주입하는 `$PORT` 로 리스닝하지 않음 | `server.port: ${PORT:8080}` 추가, Dockerfile의 중복 `-Dserver.port` 제거 |
| 2 | Render 기동 실패 — `Schema-validation: missing table` | 운영 DB는 비어 있는데 `prod` 는 `ddl-auto: validate` | **Flyway 도입** — 기동 시 `V*.sql` 자동 적용, `baseline-on-migrate` 로 기존 스키마 위에 얹음 |
| 3 | 문자열 컬럼 조회가 깨짐 (운영에서만) | `@Lob String` 이 Hibernate 6 + PostgreSQL 에서 `text` 가 아닌 `oid` 로 생성됨. H2 로컬에서는 재현되지 않음 | `@Column(columnDefinition = "TEXT")` 로 변경 |
| 4 | 프론트 연동 시 CORS 차단 | Vercel 프리뷰 배포는 서브도메인이 매번 바뀌어 고정 origin 목록으로 막힘 | `setAllowedOrigins` → `setAllowedOriginPatterns` 로 전환하고 로컬 origin 추가 |
| 5 | `main` 프론트 빌드 깨짐 | 병합 충돌 잔여물(`<<<<<<<` 마커)이 그대로 커밋됨. 자동 검사가 없어 아무도 몰랐음 | 3-way merge 재수행해 수동 병합 + **CI 워크플로 도입**(재발 방지) |
| 6 | 포인트 스키마가 마이그레이션 없이 운영에 선반영됨 | 결제 연동 PR이 엔티티만 바꾸고 `V*.sql` 을 포함하지 않음 | `V12__point_charge.sql` 사후 작성 — `ADD COLUMN IF NOT EXISTS` 등으로 **멱등하게** 작성하고, 빈 DB와 기존 DB 양쪽에서 재실행 검증 |
| 7 | 포인트 충전 결제 실패 | `paymentId` 가 PG사 주문번호 길이 제한 초과 | `paymentId` 길이를 제한 이내로 축소 |
| 8 | 동시 요청 시 처리 누락 | flush 실패를 catch해도 트랜잭션이 rollback-only로 표시되어 `UnexpectedRollbackException` | 비관적 락(`SELECT ... FOR UPDATE`)으로 구간 직렬화 + 동시성 회귀 테스트 추가 |

문제 확인에 사용한 수단은 **Render 로그(기동 실패 원인·스택트레이스), 브라우저 개발자 도구(네트워크 상태코드·CORS 메시지·콘솔 오류), `/actuator/health`·`/actuator/info`(기동 여부와 배포 커밋 식별)** 세 가지다.

---

## 8. 복구(롤백) 방안

| 대상 | 방법 | 확인 상태 |
|---|---|---|
| 프론트엔드 | Vercel Deployments 목록에서 이전 성공 배포를 **Promote to Production**(즉시 롤백). 빌드 산출물이 보존돼 있어 재빌드 없이 전환된다 | 플랫폼 기능 (대시보드 권한 보유자) |
| 백엔드 | Render Deploys 목록에서 이전 성공 배포로 **Rollback**, 또는 특정 커밋으로 Manual Deploy | 플랫폼 기능 (대시보드 권한 보유자) |
| 소스 | `main` 직접 push를 금지하고 있으므로, 문제 커밋을 `git revert` 한 뒤 PR로 되돌린다. 머지는 Squash merge라 되돌릴 단위가 PR 1개로 명확하다 | ✅ 저장소 규칙으로 확인 |
| 배포 버전 식별 | `/actuator/info` 의 `git.commit` 으로 현재 운영 중인 커밋을 확인한 뒤, 그 커밋으로 재배포 | ✅ 호출로 확인 (`8d5478c`) |
| 데이터베이스 | Flyway는 **forward-only** — 적용된 마이그레이션을 되돌리지 않는다. 스키마를 되돌려야 하면 보정 마이그레이션(예: `V15__...`)을 새로 추가한다. 데이터 자체 복구는 Neon의 백업/시점 복구 기능을 사용한다 | 정책으로 확인 (실제 복구 수행 이력 없음) |

애플리케이션 코드와 스키마의 복구 방식이 다르다는 점이 중요하다. **코드는 이전 버전으로 되돌릴 수 있지만 스키마는 앞으로만 간다.** 그래서 컬럼 삭제처럼 되돌리기 어려운 변경은 피하고, 추가 위주로 마이그레이션을 작성했다(§7-6의 멱등 작성 원칙도 같은 맥락).

---

## 9. 현재 상태 요약과 남은 과제

**정상 동작 확인됨**

- 프론트엔드(Vercel) · 백엔드(Render) · 데이터베이스(Neon) 3계층이 모두 연결된 상태로 서비스 중
- 환경별 설정 분리, 시크릿 외부화, CORS 화이트리스트, Flyway 스키마 관리 적용
- PR 단위 CI(lint · 타입체크 · 빌드 · 테스트)와 로컬 빌드 모두 통과
- 공개 조회 / 인증 / 권한 차단 / 404 처리 / CORS 프리플라이트 실측 확인

**남은 과제**

| 항목 | 내용 |
|---|---|
| 번들 크기 | JS 번들 689 kB(gzip 189 kB) — 라우트 단위 동적 import로 코드 분할 여지 |
| 콜드 스타트 | Render 무료 인스턴스 휴면으로 첫 요청이 수십 초~2분. 유료 플랜 또는 주기적 핑으로 해소 가능 |
| 배포 태그 | 현재 git 태그가 0개. `CLAUDE.md` 의 릴리스 규칙대로 배포 시점에 `v1.0.0` 형태의 태그를 남기면 "어느 배포가 어느 커밋인지" 추적이 쉬워진다 |
| 자동 배포 범위 | 모노레포라 `frontend/` 만 바뀐 커밋에도 백엔드 재배포가 걸릴 수 있음 — 경로 필터 확인 필요 |
| 미완 기능 | 인증번호 실제 발송(현재 서버 로그 출력), 실시간 알림(현재 30초 폴링) |
