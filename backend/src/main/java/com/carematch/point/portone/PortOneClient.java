package com.carematch.point.portone;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * 포트원 서버 API 클라이언트. 결제창(프론트)이 알려온 결제 결과를 그대로 믿지 않고,
 * 여기서 서버-서버로 재조회해 금액/상태를 직접 확인한다(클라이언트 위변조 방지).
 * https://developers.portone.io/api/rest-v2/payment#get%20%2Fpayments%2F%7BpaymentId%7D
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PortOneClient {

    private final PortOneProperties properties;
    private final RestClient restClient = RestClient.create();

    public PortOnePaymentResponse getPayment(String paymentId) {
        if (!properties.isConfigured()) {
            log.error("[PortOneClient] PORTONE_STORE_ID / PORTONE_API_SECRET 미설정");
            throw new BusinessException(ErrorCode.POINT_CHARGE_VERIFICATION_FAILED, "portone not configured");
        }
        try {
            return restClient.get()
                    .uri(properties.baseUrl() + "/payments/{paymentId}", paymentId)
                    .header("Authorization", "PortOne " + properties.apiSecret())
                    .retrieve()
                    .body(PortOnePaymentResponse.class);
        } catch (RestClientException e) {
            log.error("[PortOneClient] 결제 조회 실패 paymentId={}", paymentId, e);
            throw new BusinessException(ErrorCode.POINT_CHARGE_VERIFICATION_FAILED, e.getMessage());
        }
    }
}
