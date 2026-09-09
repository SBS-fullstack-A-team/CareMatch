# DB 스키마 / 마이그레이션

> 현재 마이그레이션 도구(Flyway/Liquibase) 미도입. 이 문서 + `docs/schema/` 스냅샷으로 관리한다.

## 현재 정책

| 프로필 | ddl-auto | 스키마 관리 방식 |
|---|---|---|
| `local` | `create-drop` | 매 기동 시 엔티티에서 재생성. 신경 쓸 것 없음 |
| `prod` | `validate` | **수동.** 엔티티와 실제 테이블이 다르면 앱이 기동 실패 |

`prod` 는 `validate` 이므로 **엔티티에 컬럼/테이블/enum 값이 추가되면, 배포 전에 운영 DB에 해당 DDL을 직접 반영해야 한다.** 안 하면 Hibernate 스키마 검증에서 막혀 애플리케이션이 뜨지 않는다.

## prod 최초 배포 시

운영 DB는 아직 한 번도 프로비저닝된 적이 없다(릴리스 태그 없음). 최초 배포 시 전체 스키마를 1회 생성한다.

1. DB 벤더 확정 후 `application-prod.yml` 의 `DB_URL` / `DB_DRIVER` / `DB_DIALECT` env 주입
2. 운영 DB에 접속해 스냅샷 스크립트 1회 실행
   - PostgreSQL: [`docs/schema/schema-postgresql.sql`](schema/schema-postgresql.sql)
   - 다른 벤더면 아래 "스냅샷 재생성" 으로 해당 방언 스크립트를 뽑아서 사용
3. `LocalDataInitializer` 는 `local` 전용이라 운영엔 시드가 안 들어간다. 약관 3종·관리자 계정은 운영 DB에 직접 넣어야 로그인/회원가입 검증이 동작한다.

## 배포마다 (스키마 변경이 있으면)

1. 이번 배포에 포함되는 엔티티 변경(컬럼·테이블·enum 값 추가/변경)을 확인
2. 그에 해당하는 `ALTER TABLE` / `CREATE TABLE` DDL을 작성해 **PR 설명에 명시**
3. 배포 담당자가 운영 DB에 DDL 반영 → 그다음 배포
4. `docs/schema/` 스냅샷도 재생성해서 같은 PR에 커밋

> 예: PR #29 `preferred_note` 컬럼 추가 →
> `ALTER TABLE job_posting ADD COLUMN preferred_note TEXT;` 를 배포 전 실행해야 함.
>
> 예: 회원 화면 표시 설정(쉬운 화면 모드) — `member` 에 2컬럼 추가 →
> `ALTER TABLE member ADD COLUMN easy_mode boolean NOT NULL DEFAULT false, ADD COLUMN font_scale varchar(10) NOT NULL DEFAULT 'NORMAL';`

## 스냅샷 재생성

엔티티를 바꾼 뒤 (target 파일이 이미 있으면 append 되므로 `rm` 먼저):

```bash
cd backend
rm -f build/schema-postgres.sql
./gradlew bootRun --args="\
  --spring.main.web-application-type=none \
  --spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create \
  --spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=build/schema-postgres.sql \
  --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect \
  --spring.jpa.properties.hibernate.temp.use_jdbc_metadata_defaults=false \
  --spring.jpa.hibernate.ddl-auto=none"
```

`web-application-type=none` 이라 컨텍스트 기동 직후 non-zero 로 종료되는데 정상이다. 스크립트는 그 전에 `build/schema-postgres.sql` 로 기록된다. 헤더를 붙여 `docs/schema/schema-postgresql.sql` 로 갱신한다.

## 알려진 이슈 (prod PostgreSQL 전환 전 해결 필요)

- **`@Lob String` → `oid` 매핑**: `Faq.answer`, `Inquiry.content`, `InquiryReply.content`, `Notice.content`, `Terms.content` 5개 필드가 `@Lob` 이라, Hibernate 6 + PostgreSQL 조합에서 `text` 가 아닌 `oid`(large object 포인터) 컬럼으로 생성된다. 이 상태로는 일반 문자열 insert/조회가 깨진다.
  - 해결: `@Lob` 을 떼고 `@Column(columnDefinition = "TEXT")` 로 교체(코드베이스의 `JobPosting.description` 등과 동일 컨벤션). 또는 `@JdbcTypeCode(SqlTypes.LONGVARCHAR)` 부여.
  - H2(`local`)에서는 문제가 안 드러나므로 놓치기 쉽다.
- 생성된 스냅샷의 FK 제약 이름이 Hibernate 자동 해시(`FKtik35v4...`)다. 운영에서 이름을 관리하려면 명시 지정 필요.

## 후속 과제 — Flyway 도입

수동 관리는 팀 인원이 늘거나 배포가 잦아지면 실수가 난다. 도입 시:

1. `build.gradle` 에 `org.flywaydb:flyway-core` (+ PostgreSQL 이면 `flyway-database-postgresql`) 추가
2. `docs/schema/schema-postgresql.sql` 를 정리해 `backend/src/main/resources/db/migration/V1__baseline.sql` 로 배치
3. `prod` 는 `ddl-auto: validate` 유지 + `spring.flyway.enabled: true`, `local` 은 기존대로 `create-drop` (Flyway 끔)
4. 이후 스키마 변경은 `V2__xxx.sql`, `V3__xxx.sql` 로만. 엔티티 + 마이그레이션 파일을 같은 PR에 함께
5. 운영 DB가 이미 있으면 `spring.flyway.baseline-on-migrate: true` + `baseline-version` 설정
