/// <reference types="vite/client" />
/// <reference types="kakao.maps.d.ts" />

interface ImportMetaEnv {
  /** 백엔드 API 베이스 URL (예: http://localhost:8080). .env.local / Vercel 환경변수에서 주입 */
  readonly VITE_API_BASE_URL: string
  /** 카카오맵 JavaScript 키 (내 주변 일자리 지도). developers.kakao.com > 내 애플리케이션 > 앱 키 */
  readonly VITE_KAKAO_MAP_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
