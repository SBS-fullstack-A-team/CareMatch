package com.carematch.point.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** 충전할 금액(원=포인트). 결제창을 열기 전, 서버에 결제건(paymentId)을 먼저 만들 때 보낸다. */
public record PointChargePrepareRequest(
        @NotNull
        @Min(1_000)
        @Max(1_000_000)
        Long amount
) {
}
