package com.carematch.point.portone;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * 포트원 결제 단건 조회(GET /payments/{paymentId}) 응답 중 검증에 필요한 필드만 매핑.
 * 나머지 필드(결제수단 상세, 고객정보 등)는 이번 범위에서 쓰지 않아 무시한다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PortOnePaymentResponse(
        String id,
        /** PAID / READY / VIRTUAL_ACCOUNT_ISSUED / CANCELLED / FAILED 등. */
        String status,
        Amount amount
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Amount(long total) {
    }
}
