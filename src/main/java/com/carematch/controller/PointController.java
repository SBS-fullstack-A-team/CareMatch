package com.carematch.controller;


import com.carematch.service.PointService;
import com.carematch.dto.PointChargeRequest;
import com.carematch.global.ApiResponse;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/members/me/points")
public class PointController {

    private final PointService pointService;

    /** 실제 결제 연동 없는 가짜 충전 엔드포인트 (데모/개발용). */
    @PostMapping("/charge")
    public ApiResponse<Void> charge(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PointChargeRequest request) {
        pointService.charge(userDetails.getMemberId(), request.amount(), "포인트 충전(가짜결제)");
        return ApiResponse.success();
    }
}
