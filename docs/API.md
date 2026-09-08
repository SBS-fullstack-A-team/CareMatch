# 케어매치 API 명세 (회원/인증/보안/고객센터)

- Base URL(local): `http://localhost:8080`
- 인증: `Authorization: Bearer <accessToken>`
- 공통 에러 응답
  ```json
  {
    "code": "MEMBER_002",
    "message": "이미 사용 중인 이메일입니다.",
    "timestamp": "2026-09-07T12:34:56.789+09:00",
    "path": "/api/members/jobseekers",
    "fieldErrors": [ { "field": "email", "reason": "형식이 올바르지 않습니다." } ]
  }
  ```
- 권한: `ROLE_JOBSEEKER` / `ROLE_FACILITY` / `ROLE_ADMIN` / `ROLE_GUEST`(소셜 유형 미선택)

---

## 1. 인증코드 (회원가입 전, 공개)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/verifications/send` | 이메일/휴대폰 인증코드 발송(목업: 로그 출력) |
| POST | `/api/verifications/verify` | 인증코드 검증 |

```http
POST /api/verifications/send
{ "channel": "EMAIL", "target": "hong@example.com" }

200 { "channel": "EMAIL", "target": "hong@example.com",
      "expiresAt": "2026-09-07T12:40:00+09:00", "devCodeHint": "204913" }  // devCodeHint는 local에서만
```
```http
POST /api/verifications/verify
{ "channel": "EMAIL", "target": "hong@example.com", "code": "204913" }
200 { "verified": true }
```

## 2. 회원가입

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/members/exists?loginId=&email=` | 공개 | 아이디/이메일 중복확인 |
| POST | `/api/members/jobseekers` | 공개 | 구직자 회원가입 |
| POST | `/api/members/facilities` | 공개 | 시설 회원가입(PENDING 생성) |
| GET | `/api/members/me` | 인증 | 마이페이지 요약(포인트/유형) |

```http
GET /api/members/exists?loginId=hong123&email=hong@example.com
200 { "loginIdAvailable": true, "emailAvailable": false }
```
```http
POST /api/members/jobseekers
{
  "loginId": "hong123",
  "password": "Passw0rd!",
  "email": "hong@example.com",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "residence": "서울특별시 강남구 역삼동 123-45",
  "verificationChannel": "EMAIL",
  "verificationTarget": "hong@example.com",
  "agreements": [
    { "type": "SERVICE",   "version": "1.0", "agreed": true },
    { "type": "PRIVACY",   "version": "1.0", "agreed": true },
    { "type": "MARKETING", "version": "1.0", "agreed": false }
  ]
}
201 { "memberId": 12, "role": "JOBSEEKER", "status": "ACTIVE",
      "approvalStatus": null, "message": "회원가입이 완료되었습니다." }
```
```http
POST /api/members/facilities
{
  "loginId": "sunshine",
  "password": "Passw0rd!",
  "email": "admin@sunshine.co.kr",
  "name": "김담당",
  "phone": "010-9999-8888",
  "facilityName": "햇살요양원",
  "businessRegistrationNumber": "220-81-62517",
  "businessLicenseFileKey": "business-license/2026/09/uuid.pdf",
  "verificationChannel": "PHONE",
  "verificationTarget": "010-9999-8888",
  "agreements": [
    { "type": "SERVICE", "version": "1.0", "agreed": true },
    { "type": "PRIVACY", "version": "1.0", "agreed": true },
    { "type": "MARKETING", "version": "1.0", "agreed": true }
  ]
}
201 { "memberId": 13, "role": "FACILITY", "status": "ACTIVE",
      "approvalStatus": "PENDING",
      "message": "회원가입이 접수되었습니다. 관리자 승인 후 인재 열람/공고 등록이 가능합니다." }
```
```http
GET /api/members/me     (Authorization: Bearer ...)
200 {
  "memberId": 13, "name": "김담당", "email": "admin@sunshine.co.kr",
  "role": "FACILITY", "membershipType": "BASIC", "point": 9999,
  "employmentStatus": null, "facilityApprovalStatus": "PENDING"
}
```

## 3. 로그인 / 토큰

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| POST | `/api/auth/login` | 공개 | 아이디/비밀번호 로그인 |
| POST | `/api/auth/reissue` | 공개 | Refresh 로 Access 재발급(+Refresh rotation) |
| POST | `/api/auth/logout` | 공개 | Refresh Token 무효화 |
| POST | `/api/auth/social/select-role` | 인증(GUEST) | 소셜 최초 로그인 후 회원 유형 확정 |
| GET | `/oauth2/authorization/{naver\|kakao\|google}` | 공개 | 소셜 로그인 시작(리다이렉트) |

```http
POST /api/auth/login
{ "loginId": "hong123", "password": "Passw0rd!" }
200 {
  "accessToken": "eyJ...", "refreshToken": "eyJ...",
  "tokenType": "Bearer", "accessTokenExpiresIn": 1800, "roleSelected": true
}
```
- 로그인 5회 연속 실패 → `423 ACCOUNT_LOCKED` (기본 15분 잠금)

```http
POST /api/auth/reissue
{ "refreshToken": "eyJ..." }
200 { "accessToken": "eyJ...", "refreshToken": "eyJ...(new)", "tokenType": "Bearer",
      "accessTokenExpiresIn": 1800, "roleSelected": true }
```
```http
POST /api/auth/logout
{ "refreshToken": "eyJ..." }
204
```
### 소셜 로그인 흐름
1. 프론트가 `GET /oauth2/authorization/kakao` 로 이동
2. 성공 시 서버가 `OAUTH_SUCCESS_REDIRECT` 로 리다이렉트:
   `.../oauth/callback?accessToken=...&refreshToken=...&roleSelected=false`
3. `roleSelected=false` 면 유형 선택 화면 → 아래 호출
```http
POST /api/auth/social/select-role     (Authorization: Bearer <GUEST accessToken>)
{ "role": "FACILITY", "facilityName": "햇살요양원",
  "businessRegistrationNumber": "220-81-62517",
  "businessLicenseFileKey": "business-license/2026/09/uuid.pdf" }
200 { "accessToken": "eyJ...(FACILITY 권한)", "refreshToken": "eyJ...",
      "tokenType": "Bearer", "accessTokenExpiresIn": 1800, "roleSelected": true }
```

## 4. 파일 업로드 URL (스토리지 스텁)

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| POST | `/api/files/upload-url` | 공개 | 업로드용(임시) URL 발급 |
| POST | `/api/files/confirm` | 공개 | 업로드 완료 후 파일 검증(스텁: 더미 메타) |

```http
POST /api/files/upload-url
{ "purpose": "BUSINESS_LICENSE", "originalFilename": "license.pdf", "contentType": "application/pdf" }
200 {
  "fileKey": "business-license/2026/09/6f1c...-.pdf",
  "uploadUrl": "https://files.example.invalid/_stub-upload/business-license/2026/09/6f1c...pdf?expires=...",
  "httpMethod": "PUT",
  "expiresAt": "2026-09-07T12:45:00+09:00"
}
```

## 5. 약관 (공개 조회)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/terms` | 현재 유효 약관 3종 요약(본문 제외) |
| GET | `/api/terms/{SERVICE\|PRIVACY\|MARKETING}` | 특정 약관 본문 포함 |

```http
GET /api/terms
200 [ { "id": 1, "type": "SERVICE", "version": "1.0", "title": "이용약관",
        "required": true, "content": null }, ... ]
```

## 6. 인재 조회 / 연락처 열람

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/jobseekers` | FACILITY(승인)·ADMIN | 인재 검색 목록 (`PageResponse<TalentSummary>`) |
| GET | `/api/jobseekers/me` | JOBSEEKER | 내 프로필(전체 공개) + 자격증 서명 URL |
| PUT | `/api/jobseekers/me` | JOBSEEKER | 내 프로필 수정(인적사항·표시필드·희망 근무조건 전체 덮어쓰기) |
| GET | `/api/jobseekers/{profileId}` | FACILITY(승인)·ADMIN | 인재 상세(연락처/거주지 마스킹) |
| POST | `/api/jobseekers/{profileId}/contact/unlock` | FACILITY(승인) | 연락처 열람하기 |

- 미승인(PENDING/REJECTED) 시설회원이 `/api/jobseekers/**` 접근 → `403 FACILITY_NOT_APPROVED`
- 희망 근무조건(`desired*`)은 전부 선택. 매칭 스코어 계산 근거이며, 미설정 시 응답에서 `null`.

### 인재 검색 (`GET /api/jobseekers`)

승인된 시설회원 / 관리자만. 필터·정렬은 쿼리 파라미터. 지역·직종·근무형태·급여는 구직자 **희망조건** 컬럼 기준
(해당 희망조건 미설정 구직자는 그 필터에서 제외).

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `desiredJobType` / `desiredWorkType` | enum | 희망 직종 / 희망 근무형태 |
| `sido` / `sigungu` | string | 희망 근무지역(정확히 일치) |
| `payType` / `payMax` | enum / int | 희망 급여유형 / 희망 최소급여가 이 값 이하인 인재만 |
| `gender` | enum | `MALE` / `FEMALE` |
| `minCareerYears` | int | 경력 연수가 이 값 이상 (0/1/3 …) |
| `availableTasks` | enum[] | 가능 업무 다중. 하나라도 겹치면 매칭 (`?availableTasks=MEAL_SUPPORT&availableTasks=BATH_SUPPORT`) |
| `desiredEmploymentTypes` | enum[] | 희망 고용형태 다중. 하나라도 겹치면 매칭 |
| `seekingOnly` | bool | 생략/true = 구직중(SEEKING)만. false = 취업완료 포함 |
| `updatedWithinDays` | int | 최근 N일 내 프로필 갱신 |
| `sort` | string | `LATEST`(기본, 최근 갱신순) — 매칭점수 정렬은 SQL 불가로 미지원(구인공고 RECOMMENDED 와 동일 제약) |
| `page` / `size` | int | 기본 0 / 20. size 상한 100 |

enum: `CareTask` = `DAILY_LIFE_SUPPORT/MEAL_SUPPORT/BATH_SUPPORT/MOBILITY_SUPPORT/COGNITIVE_ACTIVITY/PERSONAL_HYGIENE/HOUSEWORK/HOSPITAL_ESCORT`,
`EmploymentType` = `FULL_TIME/CONTRACT/TEMPORARY/PART_TIME`, `Gender` = `MALE/FEMALE`, `EducationLevel` = `MIDDLE_SCHOOL/HIGH_SCHOOL/ASSOCIATE/BACHELOR/GRADUATE`.

- `TalentSummary`: `profileId, memberId, name, employmentStatus, gender, age, photoUrl, careerYears, education, desired*, desiredWorkDays, desiredWorkStartTime, desiredWorkEndTime, certificateNames[], updatedAt, matchScore`
- `age` = 올해 − `birthYear` (birthYear 미설정이면 null).
- `matchScore`: **시설회원이 조회 시** 그 시설의 OPEN 공고들 중 최고 매칭 점수. 관리자·공고 없음·인재 희망조건 미설정이면 `null`.

```http
GET /api/jobseekers?desiredJobType=CAREGIVER&sido=서울특별시&sigungu=강남구&gender=FEMALE&minCareerYears=3     (Authorization: Bearer <FACILITY>)
200 { "content": [ { "profileId": 42, "name": "김미영", "employmentStatus": "SEEKING",
        "gender": "FEMALE", "age": 52, "photoUrl": "https://...", "careerYears": 3, "education": "HIGH_SCHOOL",
        "desiredJobType": "CAREGIVER", "desiredSido": "서울특별시", "desiredSigungu": "강남구",
        "desiredPayType": "HOURLY", "desiredMinPay": 13000,
        "desiredWorkDays": "월~금", "desiredWorkStartTime": "09:00:00", "desiredWorkEndTime": "16:00:00",
        "certificateNames": ["요양보호사 자격증"], "updatedAt": "...", "matchScore": 92 } ],
      "page": 0, "size": 20, "totalElements": 1, "totalPages": 1 }
```

### 인재 상세 매칭 (`GET /api/jobseekers/{id}`, 시설회원)

상세 응답에 아래가 추가된다 (본인 `/me` 조회 시 `matchScore=null`, `postingMatches=[]`):

- `matchScore`: 그 시설 OPEN 공고 중 최고 점수
- `postingMatches`: `[{ jobPostingId, title, jobType, matchScore }]` — 공고별 매칭 (점수 내림차순). 목업 "이 인재와 우리 공고 매칭도".

```http
PUT /api/jobseekers/me        (Authorization: Bearer <JOBSEEKER>)
{
  "employmentStatus": "SEEKING",
  "residence": "서울특별시 강남구 역삼동 123-45",
  "introduction": "10년 경력 요양보호사입니다.",
  "headline": "꼼꼼하고 성실하게 어르신을 모시겠습니다",   // 한 줄 소개, 선택
  "gender": "FEMALE",                       // 선택
  "birthYear": 1974,                        // 선택 (나이는 응답에서 계산)
  "photoUrl": "https://cdn.example.com/p.jpg",   // http(s), ≤500, 선택
  "careerYears": 3,                         // 0 이상, 선택
  "education": "HIGH_SCHOOL",               // EducationLevel, 선택
  "availableTasks": ["MEAL_SUPPORT","BATH_SUPPORT"],   // CareTask[], 선택
  "desiredJobType": "CAREGIVER", "desiredWorkType": "COMMUTE",
  "desiredSido": "서울특별시", "desiredSigungu": "강남구",
  "desiredPayType": "MONTHLY", "desiredMinPay": 2500000,
  "desiredEmploymentTypes": ["FULL_TIME","CONTRACT"],  // EmploymentType[], 선택
  "desiredWorkDays": "월~금", "desiredWorkStartTime": "09:00", "desiredWorkEndTime": "16:00"
}
200 {  // JobSeekerProfileResponse (아래 GET 상세와 동일 구조)
  "profileId": 42, "name": "홍길동", "employmentStatus": "SEEKING",
  "gender": "FEMALE", "age": 52, "photoUrl": "https://...", "careerYears": 3,
  "education": "HIGH_SCHOOL", "headline": "...", "availableTasks": ["BATH_SUPPORT","MEAL_SUPPORT"],
  "desiredJobType": "CAREGIVER", "desiredEmploymentTypes": ["CONTRACT","FULL_TIME"],
  "desiredWorkDays": "월~금", "desiredWorkStartTime": "09:00:00", "desiredWorkEndTime": "16:00:00",
  "matchScore": null, "postingMatches": []
}
```
- 인적사항·표시필드·희망조건은 요청 값으로 **전체 덮어쓰기**(부분수정 아님). 안 보낸 값은 `null` / 빈 리스트로 저장됨.
- `availableTasks` / `desiredEmploymentTypes` 응답은 enum 이름 정렬됨.

```http
GET /api/jobseekers/42        (Authorization: Bearer <FACILITY>)
200 {
  "profileId": 42, "memberId": 12, "name": "홍길동",
  "employmentStatus": "SEEKING",
  "phone": "010-****-5678",              // 마스킹
  "residence": "서울특별시 강남구",       // 마스킹
  "introduction": "...",
  "contactUnlocked": false,
  "unlockCost": 300,
  "certificates": [
    { "id": 5, "certificateName": "요양보호사 1급", "certificateNumber": "2020-...",
      "status": "VERIFIED",
      "downloadUrl": "https://files.example.invalid/_stub-download/certificate/...?expires=...&sig=..." }
  ],
  "desiredJobType": "CAREGIVER", "desiredWorkType": "COMMUTE",
  "desiredSido": "서울특별시", "desiredSigungu": "강남구",
  "desiredPayType": "MONTHLY", "desiredMinPay": 2500000    // 미설정 시 각각 null
}
```
```http
POST /api/jobseekers/42/contact/unlock    (Authorization: Bearer <FACILITY>)

// (A) 최초 열람 — (스텁)포인트 차감 후 이력 저장
200 { "profileId": 42, "phone": "01012345678", "residence": "서울특별시 강남구 역삼동 123-45",
      "free": false, "pointsSpent": 300, "unlockedAt": "2026-09-07T12:50:00+09:00" }

// (B) 재열람 — 무료
200 { "profileId": 42, "phone": "01012345678", "residence": "서울특별시 강남구 역삼동 123-45",
      "free": true, "pointsSpent": 0, "unlockedAt": "2026-09-07T12:50:00+09:00" }

// (C) 대상이 취업완료
409 { "code": "UNLOCK_001", "message": "이미 취업이 완료된 구직자의 연락처는 열람할 수 없습니다.", ... }
```

## 7. 자격증 (구직자 본인)

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| POST | `/api/certificates` | JOBSEEKER | 자격증 등록(fileKey) |
| POST | `/api/certificates/{id}/verify` | JOBSEEKER | 업로드 완료 검증(스텁 메타) |
| GET | `/api/certificates/me` | JOBSEEKER | 내 자격증 목록(서명 URL) |
| DELETE | `/api/certificates/{id}` | JOBSEEKER | 삭제 |

```http
POST /api/certificates
{ "certificateName": "요양보호사 1급", "certificateNumber": "2020-12345",
  "fileKey": "certificate/2026/09/uuid.jpg" }
201 { "id": 5, "certificateName": "요양보호사 1급", "status": "PENDING",
      "downloadUrl": "https://.../_stub-download/certificate/...?expires=...", ... }
```

## 8. 고객센터 (공개 조회)

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/support/notices?page=0&size=10` | 공개 | 공지 목록(상단고정 우선) |
| GET | `/api/support/notices/{id}` | 공개 | 공지 상세(조회수 +1) |
| GET | `/api/support/faqs?category=` | 공개 | FAQ 목록 |
| GET | `/api/support/site-config` | 공개 | 전화/카카오 채널 등 정적 정보 |
| POST | `/api/support/inquiries` | 인증 | 1:1 문의 등록 |
| GET | `/api/support/inquiries/me` | 인증 | 내 문의 목록 |
| GET | `/api/support/inquiries/{id}` | 인증(본인)·ADMIN | 문의 상세(+답변) |

```http
GET /api/support/site-config
200 { "tel": "1600-0000", "kakaoChannelUrl": "https://pf.kakao.com/_carematch",
      "operatingHours": "평일 09:00~18:00 (점심 12:00~13:00 제외)" }
```
```http
POST /api/support/inquiries     (Authorization: Bearer ...)
{ "title": "포인트 환불 문의", "content": "...", "attachmentFileKey": null }
201 { "id": 7, "memberId": 12, "title": "포인트 환불 문의", "status": "PENDING", "replies": [], ... }
```

## 9. 관리자 (ROLE_ADMIN)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/admin/facilities?status=PENDING` | 시설 승인 목록(+사업자등록증 서명 URL) |
| POST | `/api/admin/facilities/{profileId}/approve` | 승인 |
| POST | `/api/admin/facilities/{profileId}/reject` | 반려 `{ "reason": "..." }` |
| POST/PUT/DELETE | `/api/admin/support/notices[/{id}]` | 공지 CRUD |
| POST/PUT/DELETE | `/api/admin/support/faqs[/{id}]` | FAQ CRUD |
| GET | `/api/admin/support/inquiries?status=` | 전체 문의 |
| GET | `/api/admin/support/inquiries/{id}` | 문의 상세 |
| POST | `/api/admin/support/inquiries/{id}/replies` | 답변 등록 `{ "content": "..." }` |

```http
POST /api/admin/facilities/13/approve     (Authorization: Bearer <ADMIN>)
200 { "facilityProfileId": 13, "memberId": 13, "facilityName": "햇살요양원",
      "businessRegistrationNumber": "2208162517", "approvalStatus": "APPROVED",
      "processedAt": "2026-09-07T13:00:00", "rejectReason": null,
      "businessLicenseUrl": "https://.../_stub-download/business-license/...?expires=..." }
```

## 10. 헬스체크

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 간단 상태 |
| GET | `/actuator/health` | 상세(liveness/readiness) |

---

## local 시드 데이터
- 관리자: `admin` / `Admin123!`
- 약관 3종 v1.0 (SERVICE·PRIVACY·MARKETING) active
- 샘플 공지 1건, FAQ 1건

---

## 11. 구인공고 (job posting)

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/job-postings` | 공개 | 모집중(OPEN) 목록/검색. 필터·정렬 아래 참고 |
| GET | `/api/job-postings/featured` | 공개 | "소페셜 채용정보" — 만료 안 된 SPECIAL 공고 상위 3 |
| POST | `/api/job-postings/{id}/scrap` | 인증 | 찜 추가 (멱등, 204) |
| DELETE | `/api/job-postings/{id}/scrap` | 인증 | 찜 취소 (멱등, 204) |
| GET | `/api/members/me/scraps` | 인증 | 내 찜 목록 (최신순, `PageResponse<SummaryResponse>`) |
| GET | `/api/job-postings/{id}/similar` | 공개 | 비슷한 공고 (같은 시군구+직종, 최대 6, `List<SummaryResponse>`) |
| GET | `/api/job-postings/{id}` | 공개 | 상세. 호출 시 조회수 +1 |
| POST | `/api/job-postings` | ROLE_FACILITY + 승인 | 등록. 포인트 차감(기본 500P + 노출옵션) |
| PUT | `/api/job-postings/{id}` | 작성 시설 본인 | 수정 (노출옵션/상태/조회수는 불변) |
| PATCH | `/api/job-postings/{id}/close` | 작성 시설 본인 | 마감 (OPEN→CLOSED). `DetailResponse` 반환. 이미 마감이면 409 `JOBPOSTING_004` |
| DELETE | `/api/job-postings/{id}` | 작성 시설 본인 | 삭제 |
| POST | `/api/job-posting-drafts` | ROLE_FACILITY + 승인 | 임시저장 생성 (201) |
| GET | `/api/job-posting-drafts` | 본인 | 내 임시저장 목록 (`updatedAt` 내림차순, `List<DraftSummary>`) |
| GET | `/api/job-posting-drafts/{id}` | 본인 | 임시저장 단건 (폼에 로드, `formJson` 포함) |
| PUT | `/api/job-posting-drafts/{id}` | 본인 | 임시저장 덮어쓰기 |
| DELETE | `/api/job-posting-drafts/{id}` | 본인 | 임시저장 삭제 (204) |

- 카테고리성 필드는 전부 enum 문자열. 잘못된 값 → 400 `COMMON_001`.
- `duties` / `requiredDocuments` 는 문자열 배열 (표시용).
- 응답 계산필드: `dDay`(마감까지 일수), `isNew`(등록 3일 내), `isClosingSoon`(D-7 & OPEN), `isRecommended`(`matchingScore` ≥ 70).
- `matchingScore`(0~100): **로그인한 구직자**가 희망조건(`desired*`, `PUT /api/jobseekers/me`)을 설정한 경우만 채워진다. 비로그인·시설회원·희망조건 미설정이면 `null`.
  - 가중치: 직종 35 / 지역 30(시군구 일치 만점, 시도만 일치 절반) / 근무형태 20(협의는 일치 처리) / 급여 15(희망액 충족 만점, 미달 시 비율, 급여유형 다르면 0).
  - 지정한 항목들의 가중치 합을 100점으로 환산 — 예: 직종·지역만 지정했으면 그 둘로 100점.
  - 목록 정렬(`sort=RECOMMENDED`)은 노출등급→최신 순 그대로. `matchingScore` 로는 재정렬하지 않음(페이지네이션 일관성).
- `matchingReasons`(`List<String>`): **상세 응답 전용**. 실제로 일치한 항목의 문구만 담는다
  (예: `["희망하는 직종과 일치해요","희망하는 근무지와 일치해요","희망하는 급여 조건을 충족해요"]`).
  채점 불가(비로그인·희망조건 미설정)면 빈 리스트. 목록/featured/similar 응답에는 없음.

```http
POST /api/job-postings   (Authorization: Bearer <FACILITY>)
{
  "title": "방문요양 요양보호사 모집 (4등급 여자 어르신)",
  "jobType": "CAREGIVER", "description": "...",
  "workType": "COMMUTE", "employmentType": "CONTRACT",
  "employmentTypeNote": "3개월 후 정규직 전환 가능",
  "workDays": "월~금 (주 5일)", "workStartTime": "09:00", "workEndTime": "12:00",
  "payType": "HOURLY", "payAmount": 13500, "recruitCount": 1, "deadline": "2026-12-31",
  "sido": "서울특별시", "sigungu": "강남구", "addressDetail": "테헤란로 123 (역삼동)",
  "careGrade": "GRADE_4", "elderGender": "FEMALE", "elderAgeRange": "70대",
  "mobilityStatus": "INDEPENDENT", "mealStatus": "ASSIST", "cognitiveStatus": "NORMAL",
  "duties": ["말벗","식사준비","청소","병원동행"],
  "requiredDocuments": ["요양보호사 자격증","이력서","건강검진서"],
  "exposureType": "SPECIAL"
}
201 { "id": 1, ...전체 필드..., "status": "OPEN", "dDay": 115, "viewCount": 0,
      "facilityName": "강남소망재가노인복지센터", "facilityPhone": "010-1234-5678",
      "matchingScore": null }
```

```http
GET /api/job-postings?page=0&size=20
200 { "content": [ { "id": 1, "title": "...", "sigungu": "강남구",
        "exposureType": "SPECIAL", "isNew": true, "dDay": 115,
        "facilityName": "강남소망재가노인복지센터", "duties": ["말벗", ...] } ],
      "page": 0, "size": 20, "totalElements": 1, "totalPages": 1 }
```
### 목록/검색 파라미터 (`GET /api/job-postings`)

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `sido` / `sigungu` | string | 지역(정확히 일치) |
| `jobTypes` | enum[] | 직종 다중 (`?jobTypes=CAREGIVER&jobTypes=HOUSEKEEPER`) |
| `workTypes` / `employmentTypes` / `careGrades` / `mobilityStatuses` | enum[] | 각 다중 |
| `payType` | enum | HOURLY/DAILY/MONTHLY |
| `payMin` / `payMax` | int | 급여 범위. payType 없이 쓰면 시급·월급이 섞이니 함께 지정 권장 |
| `sort` | string | `RECOMMENDED`(기본: 노출등급→최신) / `LATEST` / `DEADLINE` / `PAY_DESC` / `VIEWS` |
| `page` / `size` | int | 기본 0 / 20. size 상한 100 |

- 상태는 서버가 OPEN 으로 고정. 잘못된 enum 값 → 400 `COMMON_001`.
- 응답은 `PageResponse<SummaryResponse>` (`{content, page, size, totalElements, totalPages}`).

### 임시저장 (`/api/job-posting-drafts`)

등록 마법사를 중간에 저장했다가 이어서 작성하기 위한 것. **승인된 시설회원 본인만.**
`formJson` 은 프론트가 스키마를 소유하는 등록 폼 스냅샷 문자열 — 서버는 검증 없이 보관·반환만 한다.
`title` 만 목록 라벨용으로 따로 받는다. 둘 다 선택(빈 임시저장 허용).

```http
POST /api/job-posting-drafts     (Authorization: Bearer <FACILITY>)
{ "title": "방문요양 요양보호사 (작성중)", "formJson": "{\"step\":3,\"jobType\":\"CAREGIVER\", ...}" }
201 { "id": 7, "title": "방문요양 요양보호사 (작성중)",
      "formJson": "{...}", "createdAt": "...", "updatedAt": "..." }

GET /api/job-posting-drafts
200 [ { "id": 7, "title": "방문요양 요양보호사 (작성중)", "updatedAt": "..." } ]   // formJson 제외, 최신 수정순

GET /api/job-posting-drafts/7        → 200 DraftResponse (formJson 포함)
PUT /api/job-posting-drafts/7        {title, formJson} → 200 DraftResponse (덮어쓰기)
DELETE /api/job-posting-drafts/7     → 204
```

- **발행(publish) 엔드포인트 없음** — 프론트가 폼을 완성해 `POST /api/job-postings` 로 등록한 뒤 이 임시저장을 `DELETE`.
- 남의 임시저장 접근 / 없는 id → 404 `JOBPOSTING_005` (존재 여부 비노출).
- 시설당 최대 20건. 초과 시 409 `JOBPOSTING_006`.
- `formJson` 최대 20,000자, `title` 최대 100자 → 초과 시 400.
- 미승인(PENDING) 시설 → 403 `FACILITY_001`.

