package com.carematch.point;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointChargeRepository extends JpaRepository<PointCharge, Long> {

    Optional<PointCharge> findByPaymentId(String paymentId);
}
