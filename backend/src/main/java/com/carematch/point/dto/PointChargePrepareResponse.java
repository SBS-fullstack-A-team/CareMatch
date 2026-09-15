package com.carematch.point.dto;

/**
 * 프론트의 PortOne.requestPayment() 호출에 그대로 넘길 값들.
 * storeId 는 공개 값(비밀 아님) — apiSecret 은 여기 절대 포함하지 않는다.
 */
public record PointChargePrepareResponse(
        String paymentId,
        String storeId,
        long amount,
        String orderName
) {
}
