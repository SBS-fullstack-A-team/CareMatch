package com.carematch.point;

import com.carematch.point.dto.AdminPointChargeSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자 포인트충전관리 — 전체 회원 충전 내역 조회. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPointChargeService {

    private final PointChargeRepository pointChargeRepository;

    public Page<AdminPointChargeSummary> list(PointChargeStatus status, Pageable pageable) {
        Page<PointCharge> page = (status == null)
                ? pointChargeRepository.findAll(pageable)
                : pointChargeRepository.findByStatus(status, pageable);
        return page.map(AdminPointChargeSummary::from);
    }
}
