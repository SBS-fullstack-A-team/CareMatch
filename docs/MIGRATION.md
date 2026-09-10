# DB 스키마 / 마이그레이션

> **Flyway 도입됨.** `prod` 는 `backend/src/main/resources/db/migration/V*.sql` 을 앱 기동 시 자동 실행한다.
> `docs/schema/schema-postgresql.sql` 은 "현재 전체 스키마" 참고용 스냅샷(비권위)으로만 유지한다.

## 현재 정책

| 프로필 | 스키마 관리 | ddl-auto | Flyway |
|---|---|---|---|
| `local` | 매 기동 시 엔티티에서 재생성 (H2) | `create-drop` | `enabled: false` |
| `test` | 위와 동일 (H2) | `create-drop` | `enabled: false` |
| `prod` | **Flyway 마이그레이션** | `validate` (검증만) | `enabled: true`, `baseline-on-migrate: true`, `baseline-version: 1` |

`prod` 기동 순서: Flyway 가 `flyway_schema_history` 를 보고 안 돌린 `V*.sql` 을 순서대로 적용 → 그다음 Hibernate 가 엔티티 ↔ 테이블을 `validate`. 마이그레이션을 빠뜨리면 `validate` 에서 걸려 기동 실패한다.

## 배포마다 (스키마 변경이 있으면)

1. 엔티티 변경(컬럼·테이블·enum 값 추가/변경)을 확인
2. `backend/src/main/resources/db/migration/V{다음번호}__설명.sql` 파일 추가 (`ALTER TABLE` / `CREATE TABLE` ...)
   - 파일명: `V2__member_display_preference.sql` 처럼 `V<정수>__<snake_or_words>.sql`
   - **이미 머지되어 배포된 `V*.sql` 은 절대 수정 금지** (Flyway checksum 불일치로 기동 실패). 되돌릴 땐 새 `V*.sql`.
3. 엔티티 + 마이그레이션 파일을 **같은 PR** 에 함께
4. (선택) `docs/schema/schema-postgresql.sql` 스냅샷도 재생성해 갱신 — 참고용
5. 머지 → 배포하면 Flyway 가 자동 적용. 사람이 운영 DB 에 손댈 일 없음.

> DDL 문법은 "스냅샷 재생성"으로 Hibernate 가 뽑아주는 `create table` / `alter table` 을 참고해 작성하면 정확하다.

## 신규(빈) DB 를 붙일 때

`DB_URL` 만 새로 넣고 배포하면 Flyway 가 `V1` 부터 전부 실행한다. 별도 스크립트 실행 불필요.
단, `LocalDataInitializer` 는 `local` 전용이라 시드(약관 3종·관리자 계정)는 안 들어간다 →
`docs/schema/seed-prod.*.sql` 류로 직접 INSERT 해야 로그인/회원가입 약관 검증이 동작한다.

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

## 알려진 이슈

- ~~**`@Lob String` → `oid` 매핑**~~ **(해결됨)**: `Faq.answer`, `Inquiry.content`, `InquiryReply.content`, `Notice.content`, `Terms.content` 5개 필드가 `@Lob` 이라 Hibernate 6 + PostgreSQL 에서 `text` 가 아닌 `oid`(large object 포인터) 컬럼으로 생성되던 문제. `@Lob` 을 떼고 `@Column(columnDefinition = "TEXT")` 로 교체(코드베이스의 `JobPosting.description` 컨벤션과 동일). `docs/schema/schema-postgresql.sql` 의 해당 5개 컬럼도 `oid` → `text` 로 반영. H2(`local`)에서는 문제가 안 드러나므로 놓치기 쉬웠음.
- 생성된 스냅샷의 FK 제약 이름이 Hibernate 자동 해시(`FKtik35v4...`)다. 운영에서 이름을 관리하려면 명시 지정 필요.

## Flyway 도입 내역 (참고)

- `build.gradle`: `org.flywaydb:flyway-core` + `org.flywaydb:flyway-database-postgresql`
- `V1__baseline.sql`: 도입 시점 운영 DB 상태 (= `member.easy_mode`/`font_scale` 추가 **전**). 기존 Neon DB 엔 이미 있으므로 `baseline-on-migrate` 로 실행 없이 "적용됨" 처리됨.
- `V2__member_display_preference.sql`: `member` 에 `easy_mode` / `font_scale` 추가. 기존 Neon DB 엔 이 파일이 자동 적용됨.
- `local`/`test` 는 `spring.flyway.enabled: false` — H2 + `create-drop` 유지 (Postgres 방언 `V*.sql` 이 H2 에서 안 돎).
