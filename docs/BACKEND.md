# 케어매치 백엔드 (회원/인증/보안/고객센터)

Java 17 · Spring Boot 3.3 · Spring Security + JWT · JPA · Gradle

## 실행

```bash
# 로컬 (H2 인메모리, 시드 데이터 자동 생성)
./gradlew bootRun            # ./gradlew 가 없으면: gradle wrapper 로 생성 or IntelliJ 로 실행
#   또는
gradle bootRun

# 프로필 지정
SPRING_PROFILES_ACTIVE=local gradle bootRun
```

- H2 콘솔: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:carematch`)
- 관리자: `admin` / `Admin123!`

> `./gradlew` wrapper 바이너리는 저장소에 포함돼 있지 않습니다.
> IntelliJ 로 프로젝트를 열면 자동 생성되며, CLI 라면 `gradle wrapper --gradle-version 8.10.2` 를 한 번 실행하세요.
> Docker 빌드는 `gradle` 베이스 이미지를 쓰므로 wrapper 가 필요 없습니다.

## 빌드 / 배포 (Render)

```bash
docker build -t carematch-api .
docker run -p 8080:8080 --env-file .env carematch-api
```

- 환경변수 목록: [`.env.example`](../.env.example)
- 헬스체크 경로: `/actuator/health` (또는 `/health`)
- Render: Docker 런타임, Health Check Path `/actuator/health`, `PORT` 자동 주입

## 프로필

| 프로필 | DB | ddl-auto | 용도 |
|---|---|---|---|
| `local` | H2 인메모리 | `create-drop` | 개발. 시드 데이터 생성 |
| `prod` | 환경변수(`DB_URL` 등) | `validate` | 배포. **DB 벤더 미확정 → 플레이스홀더** |

## 아키텍처 / 패키지

```
com.carematch
├─ config          SecurityConfig, WebMvcConfig, *Properties, LocalDataInitializer
├─ security        JWT 필터/프로바이더, CustomUserDetails, OAuth2(네이버/카카오/구글), 승인 인터셉터
├─ common          전역 예외처리, 마스킹 유틸, 요청 로깅 필터, BaseTimeEntity
├─ member          Member/JobSeekerProfile/FacilityProfile/SocialAccount + 가입/조회/승인
├─ auth            로그인/토큰 재발급/로그아웃, RefreshToken(DB 해시 저장)
├─ terms           약관 본문+버전, 동의 이력 검증/기록
├─ verification    이메일/휴대폰 인증코드(발송 목업)
├─ certificate     요양보호사 자격증 등록/검증
├─ contact         연락처 열람 이력 + 열람 과금 흐름
├─ storage         FileStorageService(인터페이스) + Stub 구현 + 업로드 URL API
├─ point           PointService(인터페이스) + Stub 구현
└─ support         공지/FAQ/1:1문의 (+관리자)
```

## 지금 "스텁/자리만" 인 것 (구현체 교체로 확장)

| 대상 | 인터페이스 | 현재 | 확정 시 |
|---|---|---|---|
| 포인트 차감/잔액 | `PointService` | `StubPointService` (deduct 항상 true, balance 더미) | 실제 잔액/차감/동시성 구현체로 교체 |
| 파일 스토리지 | `FileStorageService` | `StubFileStorageService` (더미 URL/메타) | R2 등 확정 시 구현체 교체 |
| DB | `application-prod.yml` | 플레이스홀더 env | `DB_URL/DB_DRIVER/DB_DIALECT` 주입 |
| 인증코드 발송 | `VerificationService` | 로그 출력 | SMS/메일 연동 |
| 문의 알림 | `InquiryService` | 로그 출력 | 이메일/카카오 연동 |

## 보안 요점

- **CSRF 비활성화**: 순수 REST + JWT(헤더 인증), 세션/쿠키 미사용 → CSRF 공격 표면 없음 (SecurityConfig 주석 참고)
- **CORS**: `CORS_ALLOWED_ORIGINS` 화이트리스트만 허용(와일드카드 금지)
- **비밀번호**: BCrypt 해시, 평문 저장 안 함. 정책: 8~64자 + 영문/숫자/특수문자
- **로그인 잠금**: 연속 실패 `LOGIN_MAX_FAIL`(기본 5) 초과 시 `LOGIN_LOCK_MINUTES`(기본 15분)
- **Refresh Token**: DB 에 SHA-256 해시로만 저장, 재발급 시 rotation, 로그아웃 시 무효화
- **RBAC**: `ROLE_JOBSEEKER/FACILITY/ADMIN` + `@PreAuthorize` + SecurityFilterChain 2중
- **시설 승인 게이트**: `FacilityApprovalInterceptor` 가 미승인 시설회원의 `/api/jobseekers/**`, `/api/job-postings/**` 접근을 403 차단
- **개인정보 마스킹**: 응답 DTO 조립 시 phone/residence 마스킹, 열람 이력 있으면 언마스크
- **파일 URL**: 영구 공개 URL 금지 — 항상 서명(만료) URL
- **로깅**: `RequestLoggingFilter` 는 method/path/status/소요시간만. 본문·Authorization·쿠키 미로깅
- **전역 예외**: `@RestControllerAdvice` + 필터단 `EntryPoint`/`AccessDeniedHandler` 로 `{code,message,timestamp,path}` 통일

## 범위 밖 (다른 팀원 / 2차)
구인공고 CRUD·매칭·돌봄일지(백엔드B) / PG 결제 연동 / 실제 포인트 시스템 / 멤버십 tier
