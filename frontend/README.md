# CareMatch Frontend

React 앱. 배포는 Vercel.

> 🚧 아직 프로젝트가 초기화되지 않았습니다.
> 프론트 담당(신영·동한)이 `feature/fe-setup` 브랜치에서 이 폴더에 초기화합니다.

## 초기화 가이드 (담당자용)

```bash
cd frontend
npm create vite@latest . -- --template react   # 또는 react-ts
npm install
npm run dev        # http://localhost:5173
```

- 개발 서버 포트는 **5173(Vite)** 또는 **3000** 을 쓰세요. 백엔드 CORS 화이트리스트가 이 둘만 열려 있습니다.
  (`backend/src/main/resources/application.yml` 의 `carematch.cors.allowed-origins`)
- API 베이스 URL 은 `http://localhost:8080` (로컬 백엔드). 환경변수로 분리 권장 (`VITE_API_BASE_URL`).
- 백엔드 실행: `cd backend && ./gradlew bootRun`

## 배포 (Vercel)

- Root Directory: `frontend`
- Build Command / Output Directory 는 선택한 툴에 맞게 (`npm run build` / `dist`)
- 운영 API 주소는 Vercel 환경변수로 주입
