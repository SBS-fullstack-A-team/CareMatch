# 케어매치 — 회원/인증/보안 도메인 ERD

> DB 벤더 미확정. 표준 JPA 매핑만 사용(JSONB·벤더 함수 미사용).
> PK 는 모두 `BIGINT AUTO_INCREMENT`(IDENTITY). 시각은 `TIMESTAMP`.

## 텍스트 다이어그램

```
                          ┌────────────────────┐
                          │       member       │  공통 회원
                          ├────────────────────┤
                          │ id (PK)            │
                          │ login_id (UQ, null)│  소셜 전용이면 null
                          │ password (null)    │  BCrypt 해시, 소셜이면 null
                          │ email (UQ)         │
                          │ name / phone       │
                          │ role (null=미선택) │  JOBSEEKER/FACILITY/ADMIN
                          │ status             │  ACTIVE/SUSPENDED/WITHDRAWN
                          │ verified           │  이메일/휴대폰 1개 인증 완료
                          │ membership_type    │  BASIC (확장 여지)
                          │ login_fail_count   │
                          │ account_locked_until│
                          │ created_at/updated_at│
                          └─────────┬──────────┘
             1:1                    │ 1:1                 1:N
   ┌───────────────────┐           │           ┌────────────────────┐
   │ jobseeker_profile │           │           │  social_account    │
   ├───────────────────┤           │           ├────────────────────┤
   │ id (PK)           │           │           │ id (PK)            │
   │ member_id (FK,UQ) │───────────┤           │ provider           │ NAVER/KAKAO/GOOGLE
   │ employment_status │  SEEKING/EMPLOYED     │ provider_user_id   │
   │ residence         │  원본(응답 시 마스킹) │ member_id (FK)     │
   │ introduction      │           │           │ UQ(provider,        │
   │ gender / birth_year│ MALE/FEMALE, 나이계산 │    provider_user_id)│
   │ photo_url / headline│ 사진 URL / 한줄소개  └────────────────────┘
   │ career_years / education│ 경력연수 / MIDDLE_SCHOOL~GRADUATE
   │ desired_job_type  │  희망직종        │
   │ desired_work_type │  희망근무형태    │
   │ desired_sido / desired_sigungu │  희망지역
   │ desired_pay_type / desired_min_pay │  희망급여   (desired_* 전부 nullable,
   │ desired_work_days │  희망요일 자유표기        매칭 스코어 계산 근거)
   │ desired_work_start_time / _end_time │  희망 근무시간
   └─────────┬─────────┘           │
      1:N(ElementCollection):
        jobseeker_available_task(jobseeker_profile_id, task)              CareTask, 검색 필터
        jobseeker_desired_employment_type(jobseeker_profile_id, employment_type)  EmploymentType, 검색 필터
        1:N  │                     │           └────────────────────┘
   ┌─────────▼─────────┐           │
   │    certificate    │           │           ┌────────────────────┐
   ├───────────────────┤           │           │  facility_profile  │
   │ id (PK)           │           ├──────────▶├────────────────────┤
   │ jobseeker_profile_id (FK)     │  1:1      │ id (PK)            │
   │ certificate_name  │           │           │ member_id (FK,UQ)  │
   │ certificate_number│           │           │ facility_name      │
   │ file_key          │  스토리지 키(공개X)   │ business_registration_number (UQ)│
   │ status            │  PENDING/VERIFIED/REJECTED │ business_license_file_key │ 키(공개X)
   │ file_size /        │  검증 콜백이 채움    │ approval_status    │ PENDING/APPROVED/REJECTED
   │ content_type      │           │           │ approved_at        │
   │ reject_reason     │           │           │ reject_reason      │
   └───────────────────┘           │           └────────────────────┘
                                   │
   ┌───────────────────┐           │           ┌────────────────────┐
   │  terms_agreement  │           │           │       terms        │  약관 본문+버전
   ├───────────────────┤           │           ├────────────────────┤
   │ id (PK)           │           │           │ id (PK)            │
   │ member_id (FK)    │───────────┤           │ type               │ SERVICE/PRIVACY/MARKETING
   │ terms_type        │  동의 이력 │           │ version            │
   │ terms_version     │  (UPDATE 안함, 누적)  │ title / content    │
   │ agreed            │           │           │ required / active  │
   │ agreed_at         │           │           │ UQ(type, version)  │
   │ IDX(member_id,type)│          │           └────────────────────┘
   └───────────────────┘           │            (terms_agreement.terms_version 로 논리적 참조)
                                   │
   ┌────────────────────────┐      │           ┌────────────────────┐
   │ contact_unlock_history │      │           │   refresh_token    │
   ├────────────────────────┤      │           ├────────────────────┤
   │ id (PK)                │      │           │ id (PK)           │
   │ facility_member_id (FK)│──────┤           │ member_id         │
   │ jobseeker_profile_id(FK)│─────┘           │ token_hash (UQ)   │ SHA-256(원문 저장 X)
   │ unlocked_at            │                  │ expires_at        │
   │ points_spent          │                  │ revoked           │
   │ UQ(facility_member_id, │  ← 재열람 무료   │ created_at        │
   │    jobseeker_profile_id)│  판단 근거      │ IDX(member_id)    │
   └────────────────────────┘                  └────────────────────┘

   ┌────────────────────┐   ┌──────────┐   ┌────────────────────┐   ┌────────────────────┐
   │  verification_code │   │  notice  │   │        faq         │   │      inquiry       │
   ├────────────────────┤   ├──────────┤   ├────────────────────┤   ├────────────────────┤
   │ id (PK)           │   │ id (PK)  │   │ id (PK)           │   │ id (PK)           │
   │ channel           │   │ title    │   │ category           │   │ member_id (null=비회원)│
   │ target            │   │ content  │   │ question / answer  │   │ guest_email/pw_hash│
   │ code              │   │ pinned   │   │ sort_order         │   │ title / content   │
   │ expires_at        │   │ view_count│  └────────────────────┘   │ status            │ PENDING/ANSWERED
   │ verified          │   │ author_id│                            │ attachment_file_key│
   │ attempt_count     │   │ created_at│       ┌────────────────────┴──┐  1:N
   │ IDX(channel,target)│  └──────────┘        │    inquiry_reply       │
   └────────────────────┘                      ├───────────────────────┤
                                               │ id (PK)              │
                                               │ inquiry_id (FK)      │
                                               │ answered_by (admin id)│
                                               │ content / created_at │
                                               └───────────────────────┘
```

## 관계 요약

| 관계 | 종류 | 비고 |
|---|---|---|
| member — jobseeker_profile | 1:1 | 구직자 확장 |
| member — facility_profile | 1:1 | 시설 확장, 가입 시 PENDING |
| member — social_account | 1:N | 한 회원이 여러 소셜 연결 가능 |
| jobseeker_profile — certificate | 1:N | 자격증 여러 개 |
| member — terms_agreement | 1:N | 동의 "이력"(버전별 누적) |
| terms(type,version) — terms_agreement | 논리적 | FK 걸지 않고 version 문자열로 참조(이력 보존) |
| member(시설) — contact_unlock_history — jobseeker_profile | N:M 해소 | (열람자, 대상) UNIQUE → 재열람 무료 |
| member — refresh_token | 1:N | 로그인 세션별. 해시 저장 |

## 마스킹 정책 (엔티티엔 원본, DTO에서 마스킹)

| 필드 | 원본 | 응답 기본값 | 언마스크 조건 |
|---|---|---|---|
| phone | 01012345678 | 010-****-5678 | 본인 / 열람 이력 보유 시설회원 |
| residence | 서울시 강남구 역삼동 … | 서울특별시 강남구 | 위와 동일 |
| certificate.file_key | 스토리지 키 | 서명(만료) URL | 본인 / 권한 있는 시설회원. 영구 공개 URL 금지 |
| business_license_file_key | 스토리지 키 | 서명(만료) URL | 관리자(승인 심사) |

---

# 구인공고 도메인 ERD (job posting)

```
   ┌────────────────────┐         ┌──────────────────────────────┐
   │  facility_profile  │  1:N    │        job_posting           │
   ├────────────────────┤────────▶├──────────────────────────────┤
   │ id (PK)            │         │ id (PK)                      │
   └────────────────────┘         │ facility_profile_id (FK)     │
                                  │ title                        │
   근무조건                        │ job_type      (enum)         │ CAREGIVER/NURSING_ASSISTANT/HOUSEKEEPER/LIFE_SUPPORT/ETC
                                  │ description   (TEXT)         │
                                  │ thumbnail_url                │ 대표 이미지 URL (선택, http(s), ≤500)
                                  │ work_type     (enum)         │ COMMUTE/LIVE_IN/REMOTE/NEGOTIABLE
                                  │ employment_type (enum)       │ FULL_TIME/CONTRACT/TEMPORARY/PART_TIME
                                  │ employment_type_note         │
                                  │ work_days / work_start_time / work_end_time │
                                  │ pay_type (enum) / pay_amount │ HOURLY/DAILY/MONTHLY
                                  │ recruit_count / deadline     │ deadline = 지원마감일
   근무지                          │ sido / sigungu / address_detail │
   어르신정보                      │ care_grade (enum GRADE_1~5)  │
                                  │ elder_gender (enum) / elder_age_range │ MALE/FEMALE, "70대"
                                  │ mobility_status (enum)       │ INDEPENDENT/PARTIAL_ASSIST/BEDRIDDEN
                                  │ meal_status (enum)           │ SELF/ASSIST/TUBE
                                  │ cognitive_status (enum)      │ NORMAL/MILD/SEVERE
                                  │ elder_note (TEXT)            │ 어르신 특이사항 자유기술 (선택)
   다중값(콤마 문자열)              │ duties / required_documents  │ @Convert(StringListConverter)
   상태/노출                       │ status (enum OPEN/CLOSED)    │
                                  │ exposure_type (enum) / exposure_priority (int) / exposure_expired_at │ NORMAL/PREMIUM/SPECIAL, priority 0/1/2, 만료 시 스케줄러가 NORMAL 강등
                                  │ view_count                   │
                                  │ created_at / updated_at      │
                                  └──────────────────────────────┘
```

| 관계 | 종류 | 비고 |
|---|---|---|
| facility_profile — job_posting | 1:N | 승인된 시설이 등록. 작성자 = facility_profile.member |
| facility_profile — job_posting_draft | 1:N | 임시저장. 시설당 최대 20건 |
| job_posting — application — jobseeker_profile | N:M 해소 | (공고, 지원자) UNIQUE. 지원 |

인덱스: `(status, sigungu, job_type)`, `(deadline)`

### job_posting_draft (구인공고 임시저장)

```
id (PK) / facility_profile_id (FK) / title (nullable, ≤100) / form_json (TEXT, nullable, 프론트 소유 폼 스냅샷)
created_at / updated_at
```
인덱스: `(facility_profile_id)`. 발행 경로 없음 — 완성 시 job_posting 으로 등록 후 draft 삭제.

### application (구직신청)

```
id (PK) / job_posting_id (FK) / job_seeker_profile_id (FK)
status (enum APPLIED/ACCEPTED/REJECTED/CANCELED) / message (nullable, ≤500) / processed_at (nullable)
created_at(=지원시각) / updated_at
UQ(job_posting_id, job_seeker_profile_id)  ← CANCELED 후 재지원 시 행 재사용
IDX(job_posting_id, status), (job_seeker_profile_id, status)
```
상태 전이: APPLIED → 지원자 CANCELED / 시설 ACCEPTED·REJECTED. CANCELED → APPLIED(재지원). 알림 도메인 없음.

## 미반영 (후속 PR / 조율 필요)

- **시설 상세(시설유형·담당자명/직책·시설주소)**: `facility_profile` 확장 필요 → 회원 도메인 담당과 조율. 현재 응답은 `facilityName` + `facilityPhone`(member.phone) 만

### 반영 완료
- **다중조건 검색** (PR #12): `sido`/`sigungu`/직종·근무형태·등급·거동 다중 + 급여범위 + 정렬
- **매칭 스코어**: `jobseeker_profile.desired_*` ↔ 구인공고 적합도를 `MatchScoreCalculator` 로 계산해 로그인한 구직자에게 `matchingScore`(0~100) 제공. 정렬 반영은 미적용(페이지네이션 일관성)
