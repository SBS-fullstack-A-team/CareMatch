package com.carematch.point;

import com.carematch.point.dto.AdminPointChargeSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자: 전체 회원 포인트 충전 내역. (경로가 /api/admin/** 이므로 SecurityFilterChain 에서도 ADMIN 강제)
 */
@RestController
@RequestMapping("/api/admin/points/charges")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPointChargeController {

    private final AdminPointChargeService adminPointChargeService;

    @GetMapping
    public Page<AdminPointChargeSummary> list(
            @RequestParam(required = false) PointChargeStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return adminPointChargeService.list(status, pageable);
    }
}
