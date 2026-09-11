# Render 접속 복구 후 체크리스트

2026-09-10 기준 Render 대시보드 로그인(구글 계정)이 막혀서, 배포 관련 설정을
아무도 확인/변경하지 못하는 상태였다. 이 문서는 접속이 복구된 뒤 순서대로
확인할 항목을 정리한 것.

관련 배경: `README.md` 트러블슈팅 8번(로컬↔Render CORS 403), PR #58/#59/#69/#72.

작성일 2026-09-10

---

## 1. 배포 상태부터 확인

- [ ] **Auto-Deploy 설정** 확인 (Render 서비스 → Settings → Auto-Deploy). 꺼져 있으면
      접속이 막힌 동안 머지된 PR들이 실제 배포엔 하나도 반영되지 않았을 수 있음
- [ ] Auto-Deploy가 꺼져 있었거나 최신 반영이 의심되면 **Manual Deploy**로 최신
      `main`을 강제 배포
- [ ] 배포 로그에 찍히는 커밋 해시가 로컬 `git log -1 --oneline` 결과의 `main`
      HEAD와 일치하는지 확인

## 2. 환경변수 점검 (Environment 탭)

| 변수 | 확인/조치 |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Vercel 도메인만 등록돼 있는지 확인. 로컬 개발자가 배포 백엔드로 직접 붙어 테스트해야 하면 `http://localhost:5173` 추가 (`setAllowedOriginPatterns` 라 와일드카드 패턴도 가능) |
| `VERIFICATION_REQUIRED_FOR_SIGNUP` | 코드 기본값이 `false`라 안 건드려도 회원가입은 동작함(PR #69). 본인인증을 다시 필수로 돌리고 싶을 때만 `true`로 추가 — 이때 프론트 `Signup/index.tsx`의 `VERIFICATION_REQUIRED` 상수(PR #72)도 같이 `true`로 되돌려야 함 |
| `OAUTH_SUCCESS_REDIRECT` / `OAUTH_FAILURE_REDIRECT` | Vercel 프론트 도메인으로 정확히 설정됐는지 확인 (과거 메모 기준 미확인 상태였음) |

## 3. R2 버킷 CORS 정책 (미뤄둔 작업, Render 아닌 Cloudflare 쪽)

Cloudflare 대시보드 → R2 → `carematch-prod` → Settings → CORS policy 에
`docs/r2-bucket-cors.json` 내용을 그대로 붙여넣기. 프론트에서 브라우저 직접
업로드(사업자등록증 등) 기능을 붙일 때 필요. 지금은 백엔드 presigned URL만
쓰고 있어 급하지 않음.

## 4. 재배포 후 실사이트 검증

- [ ] 배포 사이트에서 **본인인증 없이 회원가입이 완료되는지** 확인 (2026-09-10에
      겪은 문제가 재발하지 않는지)
- [ ] 헬스체크 `https://carematch-gtke.onrender.com/actuator/health` →
      `{"status":"UP"}` 확인
- [ ] `feature/be-jobposting-fields` 등 아직 PR 안 올라온 브랜치가 있다면, 머지
      후 실제로 배포까지 이어지는지 한 번 더 크로스체크

## 5. 재발 방지 — `/actuator/info`에 배포 커밋 노출 (적용 완료)

다음에 "배포가 실제로 반영됐나?" 의심될 때 Render 대시보드에 들어가지 않고도
`curl https://carematch-gtke.onrender.com/actuator/info` 로 배포된 커밋을 바로
확인할 수 있게 함.

- 처음 계획은 Gradle `git-properties` 플러그인이었으나, Docker 빌드 컨텍스트가
  `backend/` 라 `.git` 이 없어 빌드타임엔 커밋을 못 읽음
- 대신 Render 가 **런타임에 주입하는** `RENDER_GIT_COMMIT` / `RENDER_GIT_BRANCH` /
  `RENDER_GIT_REPO_SLUG` 를 `application.yml` 의 `info.*` 로 매핑
  (`management.info.env.enabled: true` 로 env 컨트리뷰터 활성화)
- 로컬에선 해당 env 가 없어 `unknown` 으로 뜸 — 정상. 로컬은 그냥 `git log` 쓰면 됨

검증: 이 변경이 배포된 뒤

```bash
curl https://carematch-gtke.onrender.com/actuator/info
# → {"git":{"commit":"<해시>","branch":"main"},"deploy":{"repo":"SBS-fullstack-A-team/CareMatch"}}
```

의 `git.commit` 이 `git log -1 --oneline origin/main` 과 일치하면 배포 반영된 것.
