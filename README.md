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

## 시작하기

```bash
git clone https://github.com/SBS-fullstack-A-team/CareMatch.git
cd CareMatch
```

로컬 실행 방법은 프론트엔드 / 백엔드 프로젝트 세팅 후 업데이트 예정입니다.
