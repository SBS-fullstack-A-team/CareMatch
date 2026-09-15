package com.carematch.point;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import com.carematch.point.dto.PointChargeCompleteResponse;
import com.carematch.point.dto.PointChargePrepareResponse;
import com.carematch.point.portone.PortOneClient;
import com.carematch.point.portone.PortOnePaymentResponse;
import com.carematch.point.portone.PortOneProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 포인트 충전(포트원 결제) 준비/완료 처리.
 *
 * 흐름: prepare 로 paymentId 를 먼저 발급 → 프론트가 그 paymentId 로 포트원 결제창을 띄움 →
 * 결제 완료 콜백에서 프론트가 complete 호출 → 여기서 포트원 서버 API로 실제 결제 금액/상태를
 * 재확인(클라이언트가 보낸 값은 신뢰하지 않음)한 뒤에만 포인트를 적립한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointChargeService {

    private static final String PAID_STATUS = "PAID";

    private final PointChargeRepository pointChargeRepository;
    private final MemberRepository memberRepository;
    private final PortOneClient portOneClient;
    private final PortOneProperties portOneProperties;
    private final PointService pointService;

    @Transactional
    public PointChargePrepareResponse prepare(Long memberId, long amount) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // KG이니시스 등 일부 PG는 주문번호(oid) 길이를 1~40자로 제한한다 — "point-" + 하이픈 포함
        // UUID(36자)는 42자라 초과하므로, 하이픈을 뺀 UUID(32자)를 붙여 34자로 맞춘다.
        String paymentId = "pt" + UUID.randomUUID().toString().replace("-", "");
        pointChargeRepository.save(PointCharge.builder()
                .member(member)
                .paymentId(paymentId)
                .amount(amount)
                .build());

        log.info("[PointChargeService] 충전 준비 memberId={} paymentId={} amount={}", memberId, paymentId, amount);
        return new PointChargePrepareResponse(paymentId, portOneProperties.storeId(), amount, "케어매치 포인트 충전");
    }

    @Transactional
    public PointChargeCompleteResponse complete(Long memberId, String paymentId) {
        // 비관적 락으로 조회 — 같은 paymentId 로 complete 가 동시에 들어와도 한 번에 하나씩만
        // 아래 검증~markPaid 구간을 통과하게 해서 이중 적립을 막는다.
        PointCharge charge = pointChargeRepository.findByPaymentIdForUpdate(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POINT_CHARGE_REQUEST_NOT_FOUND, "paymentId=" + paymentId));

        if (!charge.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "paymentId=" + paymentId);
        }

        // 이미 처리된 요청(중복 콜백 등)이면 재검증 없이 현재 잔액만 다시 내려준다.
        if (!charge.isPending()) {
            return new PointChargeCompleteResponse(charge.getAmount(), pointService.getBalance(memberId));
        }

        PortOnePaymentResponse payment = portOneClient.getPayment(paymentId);
        if (!PAID_STATUS.equals(payment.status())) {
            throw new BusinessException(ErrorCode.POINT_CHARGE_NOT_PAID, "status=" + payment.status());
        }
        long paidAmount = payment.amount() == null ? -1 : payment.amount().total();
        if (paidAmount != charge.getAmount()) {
            throw new BusinessException(ErrorCode.POINT_CHARGE_AMOUNT_MISMATCH,
                    "expected=" + charge.getAmount() + " actual=" + paidAmount);
        }

        charge.markPaid();
        pointService.credit(memberId, charge.getAmount(), "POINT_CHARGE:paymentId=" + paymentId);

        long balance = pointService.getBalance(memberId);
        log.info("[PointChargeService] 충전 완료 memberId={} paymentId={} amount={} balance={}",
                memberId, paymentId, charge.getAmount(), balance);
        return new PointChargeCompleteResponse(charge.getAmount(), balance);
    }
}
