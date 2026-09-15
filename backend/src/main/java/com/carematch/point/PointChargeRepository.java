package com.carematch.point;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointChargeRepository extends JpaRepository<PointCharge, Long> {

    Optional<PointCharge> findByPaymentId(String paymentId);

    /** 관리자 포인트충전관리 목록 — member 를 함께 fetch 해 N+1 을 피한다. */
    @EntityGraph(attributePaths = "member")
    Page<PointCharge> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "member")
    Page<PointCharge> findByStatus(PointChargeStatus status, Pageable pageable);
}
