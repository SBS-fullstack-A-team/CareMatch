# CareMatch

요양보호사와 돌봄이 필요한 가정을 연결하는 매칭 웹 서비스입니다.

## 주요 기능

> 🚧 기획 진행 중 — 확정되는 대로 업데이트 예정

- (작성 예정)

## 기술 스택

| 구분 | 기술 | 배포 |
|---|---|---|
| 프론트엔드 | React | Vercel |
| 백엔드 | Spring Boot | Render |

## 팀원

| 이름 | GitHub | 역할 |
|---|---|---|
| Heo (팀장) | [@heo-hyuk](https://github.com/heo-hyuk) | 백엔드 |
| 신영 | [@syyu21b](https://github.com/syyu21b) | 프론트엔드 |
| 경수 | [@HurKyungsoo](https://github.com/HurKyungsoo) | 백엔드 |
| 동한 | [@Kim-dong-han](https://github.com/Kim-dong-han) | 프론트엔드 |

## 브랜치 전략 (GitHub Flow)

- `main` — 통합 + 배포 브랜치. 직접 push 금지, PR로만 병합
- `feature/*` — 기능 브랜치. `main`에서 분기 → `main`으로 PR
  - 백엔드: `feature/be-기능명`
  - 프론트엔드: `feature/fe-기능명`
- 배포 시점은 `main`에 git 태그(`vX.Y.Z`)로 표시

자세한 협업 규칙은 [`CLAUDE.md`](./CLAUDE.md) 참고.

## 저장소 구조

```
CareMatch/
├── backend/     # Spring Boot API 서버 (Render 배포)
├── frontend/    # React 앱 (Vercel 배포) — 예정
├── docs/        # API / ERD / 백엔드 문서
├── .github/     # CODEOWNERS, 워크플로우
└── CLAUDE.md    # 협업 규칙
```

## 시작하기

```bash
git clone https://github.com/SBS-fullstack-A-team/CareMatch.git
cd CareMatch

# 백엔드 (JDK 17+ 필요, 로컬은 H2 인메모리라 별도 DB 세팅 불필요)
cd backend && ./gradlew bootRun

# 프론트엔드 (예정)
# cd frontend && npm install && npm run dev
```

- 백엔드는 IntelliJ 로 열 때 `backend/` 를 Gradle 프로젝트로 임포트한다.
- 프론트 개발 서버는 `http://localhost:5173`(Vite) / `http://localhost:3000` 기준으로 백엔드 CORS 가 열려 있다.
