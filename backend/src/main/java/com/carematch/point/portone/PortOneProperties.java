package com.carematch.point.portone;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * carematch.portone.* — 포트원(PortOne) V2 결제 연동 정보.
 * storeId 는 프론트 결제창 호출에도 그대로 노출되는 공개 값이지만,
 * apiSecret 은 결제 검증(GET /payments/{id})에만 쓰는 서버 전용 비밀값 — 절대 프론트로 내려주지 않는다.
 * 값은 전부 환경변수(PORTONE_STORE_ID / PORTONE_API_SECRET / PORTONE_BASE_URL)로 주입.
 */
@ConfigurationProperties(prefix = "carematch.portone")
public record PortOneProperties(
        String storeId,
        String apiSecret,
        String baseUrl
) {
    public boolean isConfigured() {
        return hasText(storeId) && hasText(apiSecret);
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
