/// <reference types="vite/client" />
/// <reference types="kakao.maps.d.ts" />

interface ImportMetaEnv {
  /** 백엔드 API 베이스 URL (예: http://localhost:8080). .env.local / Vercel 환경변수에서 주입 */
  readonly VITE_API_BASE_URL: string
  /** 카카오맵 JavaScript 키 (내 주변 일자리 지도). developers.kakao.com > 내 애플리케이션 > 앱 키 */
  readonly VITE_KAKAO_MAP_KEY: string
  /** 포트원 V2 결제 채널 키 (포인트 충전). 포트원 콘솔 > 연동 관리 > 채널 관리 */
  readonly VITE_PORTONE_CHANNEL_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
