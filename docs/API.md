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
| GET | `/api/jobseekers/me` | JOBSEEKER | 내 프로필(전체 공개) + 자격증 서명 URL |
| GET | `/api/jobseekers/{profileId}` | FACILITY(승인)·ADMIN | 인재 상세(연락처/거주지 마스킹) |
| POST | `/api/jobseekers/{profileId}/contact/unlock` | FACILITY(승인) | 연락처 열람하기 |

- 미승인(PENDING/REJECTED) 시설회원이 `/api/jobseekers/**` 접근 → `403 FACILITY_NOT_APPROVED`

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
  ]
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
