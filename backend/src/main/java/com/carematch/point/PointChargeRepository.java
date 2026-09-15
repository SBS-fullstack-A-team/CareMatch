package com.carematch.point;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PointChargeRepository extends JpaRepository<PointCharge, Long> {

    Optional<PointCharge> findByPaymentId(String paymentId);

    /**
     * 결제 완료(complete) 처리 중 동시 요청 경쟁을 막기 위한 비관적 락 조회.
     * 같은 paymentId 로 complete 가 동시에 두 번 들어오면(중복 콜백/재시도), 먼저 잠근 트랜잭션이
     * 커밋(markPaid)될 때까지 다음 트랜잭션이 대기했다가 이미 PAID 상태를 보고 재적립하지 않는다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select pc from PointCharge pc where pc.paymentId = :paymentId")
    Optional<PointCharge> findByPaymentIdForUpdate(@Param("paymentId") String paymentId);

    /** 관리자 포인트충전관리 목록 — member 를 함께 fetch 해 N+1 을 피한다. */
    @EntityGraph(attributePaths = "member")
    Page<PointCharge> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "member")
    Page<PointCharge> findByStatus(PointChargeStatus status, Pageable pageable);
}
