# 프로젝트 규칙 (1stProject)

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

## CLI 응답 규칙

- "이번 역할이 뭐야" 질문을 받으면 위 표에서 현재 git config user.name/email에 매칭되는 사람의 역할을 찾아 답할 것
- "오늘 뭐 했어" 질문을 받으면 `git log --since="today"`로 오늘 커밋 내역을 조회해 요약하고, 아직 커밋하지 않은 변경사항(`git status`, `git diff`)도 함께 안내할 것
- 브랜치를 새로 만들 때는 항상 위 표의 역할에 맞는 접두사(feature/fe-* 또는 feature/be-*)를 사용할 것
