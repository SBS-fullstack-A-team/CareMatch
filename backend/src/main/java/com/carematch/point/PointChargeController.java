package com.carematch.point;

import com.carematch.point.dto.PointChargeCompleteRequest;
import com.carematch.point.dto.PointChargeCompleteResponse;
import com.carematch.point.dto.PointChargePrepareRequest;
import com.carematch.point.dto.PointChargePrepareResponse;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 포인트 충전(포트원 결제). 보호자회원(GENERAL)·시설회원·관리자만 이용 — 구직회원은 포인트를 쓰지 않는다.
 */
@RestController
@RequestMapping("/api/points/charge")
@RequiredArgsConstructor
public class PointChargeController {

    private final PointChargeService pointChargeService;

    /** 결제창을 띄우기 전, paymentId 를 먼저 발급받는다. */
    @PostMapping("/prepare")
    @PreAuthorize("hasAnyRole('GENERAL','FACILITY','ADMIN')")
    public PointChargePrepareResponse prepare(@AuthenticationPrincipal CustomUserDetails principal,
                                               @Valid @RequestBody PointChargePrepareRequest request) {
        return pointChargeService.prepare(principal.getMemberId(), request.amount());
    }

    /** 결제창 완료 콜백 직후 호출. 포트원 서버 재조회로 검증한 뒤에만 포인트를 적립한다. */
    @PostMapping("/complete")
    @PreAuthorize("hasAnyRole('GENERAL','FACILITY','ADMIN')")
    public PointChargeCompleteResponse complete(@AuthenticationPrincipal CustomUserDetails principal,
                                                 @Valid @RequestBody PointChargeCompleteRequest request) {
        return pointChargeService.complete(principal.getMemberId(), request.paymentId());
    }
}
