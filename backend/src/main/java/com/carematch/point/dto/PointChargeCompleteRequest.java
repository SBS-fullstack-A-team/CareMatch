package com.carematch.point.dto;

import jakarta.validation.constraints.NotBlank;

/** 결제창 완료 콜백에서 받은 paymentId. 서버가 이 값으로 포트원에 재조회해 검증한다. */
public record PointChargeCompleteRequest(
        @NotBlank String paymentId
) {
}
