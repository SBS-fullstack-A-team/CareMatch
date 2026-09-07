# 프로젝트 규칙 (1stProject)

## 사전 준비 (팀원 전원 최초 1회)

PR 자동 생성 기능을 쓰려면 GitHub CLI(`gh`)가 설치되어 있어야 합니다.

**설치 확인**
```bash
gh --version
```
→ 버전이 뜨면 설치되어 있는 것, 안 뜨면 아래 설치 진행

**설치 방법**

Windows (PowerShell, 관리자 권한):
```powershell
winget install --id GitHub.cli
```

Mac:
```bash
brew install gh
```

**로그인**
```bash
gh auth login
```
- `GitHub.com` 선택 → `HTTPS` 선택 → `Login with a web browser` 선택
- 코드가 나오면 복사 → 브라우저 열리면 붙여넣고 로그인/승인

**로그인 확인**
```bash
gh auth status
```
→ `Logged in to github.com as 본인아이디` 뜨면 완료

## 팀원 & Git 계정 정보

| 이름 | GitHub 아이디 | 역할 | 담당 브랜치 접두사 |
|---|---|---|---|
| Heo (팀장) | heo-hyuk | 백엔드 | feature/be-* |
| 신영 | syyu21b | 프론트엔드 | feature/fe-* |
| 경수 | HurKyungsoo | 백엔드 | feature/be-* |
| 동한 | Kim-dong-han | 프론트엔드 | feature/fe-* |

## 커밋 규칙

- 커밋 전, 현재 로컬 git config의 user.name / user.email이 위 표의 본인 GitHub 계정과 일치하는지 확인할 것
- 다르면 아래처럼 **로컬(이 프로젝트 한정)**로 설정할 것:
  ```bash
  git config user.name "본인이름"
  git config user.email "본인 GitHub 계정 이메일"
  ```
- 커밋 메시지는 아래 컨벤션을 따를 것

| 태그 | 의미 |
|---|---|
| `feat:` | 새로운 기능 추가 |
| `fix:` | 버그 수정 |
| `refactor:` | 코드 리팩토링 |
| `style:` | 코드 포맷팅, 세미콜론 등 |
| `docs:` | 문서 수정 |
| `chore:` | 빌드/설정 파일 수정 |

예시: `feat: 로그인 API 연동`, `fix: 회원가입 유효성 검사 오류 수정`

## 브랜치 전략

```
main        # 배포/최종본, 직접 push 금지
develop     # 개발 통합 브랜치, 모든 작업은 여기서 분기
feature/*   # 개별 기능 작업 브랜치
```

- 프론트 담당자(신영, 동한): `feature/fe-기능명`
- 백엔드 담당자(Heo, 경수): `feature/be-기능명`
- 각자 본인 role에 맞는 브랜치명만 생성할 것

예시: `feature/fe-login`, `feature/be-login-api`, `feature/fe-mypage`, `feature/be-board-crud`

## 작업 흐름

1. 작업 시작 전 develop 최신화
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. 본인 role에 맞는 브랜치 생성
   ```bash
   git checkout -b feature/역할-기능명
   ```
3. 작업 후 커밋 & push
   ```bash
   git add .
   git commit -m "feat: 작업내용"
   git push origin feature/역할-기능명
   ```
4. GitHub에서 `develop`으로 PR 생성
5. 팀원 1명 이상 리뷰 승인 후 머지 (Squash and merge)
6. 머지 완료된 브랜치는 삭제

## 규칙

- ⚠️ `main`, `develop`에 직접 push 금지 — 반드시 PR을 통해서만 병합
- ✅ 작업 시작 전 `develop`을 최신 상태로 pull 받고 시작하기
- ✅ PR 올리기 전 최소 1명 이상 코드 리뷰 승인받기
- ✅ 본인 역할(프론트/백엔드)에 맞는 브랜치 접두사만 사용

## PR 생성 규칙

- "오늘 ~작업했어" 또는 "커밋하고 PR까지 만들어줘"라고 말하면 아래 순서로 진행할 것:
  1. 현재 브랜치가 `feature/*`인지 확인 (main, develop이면 먼저 feature 브랜치 생성)
  2. `git add`, `git commit` (커밋 컨벤션 태그 사용)
  3. `git push origin 현재브랜치명`
  4. GitHub CLI로 PR 생성:
     ```bash
     gh pr create --base develop --head feature/역할-기능명 \
       --title "feat: 기능 설명" \
       --body "작업 내용 요약"
     ```
  5. PR 링크를 사용자에게 안내
- **PR 승인(approve)과 머지(merge)는 절대 자동으로 하지 말 것** — 반드시 팀원 리뷰 후 사람이 직접 GitHub에서 진행
- `gh` 명령 실행 전 `gh auth status`로 로그인 상태 확인, 안 되어 있으면 `gh auth login` 안내할 것

## CLI 응답 규칙

- "이번 역할이 뭐야" 질문을 받으면 위 표에서 현재 git config user.name/email에 매칭되는 사람의 역할을 찾아 답할 것
- "오늘 뭐 했어" 질문을 받으면 `git log --since="today"`로 오늘 커밋 내역을 조회해 요약하고, 아직 커밋하지 않은 변경사항(`git status`, `git diff`)도 함께 안내할 것
- 브랜치를 새로 만들 때는 항상 위 표의 역할에 맞는 접두사(feature/fe-* 또는 feature/be-*)를 사용할 것
