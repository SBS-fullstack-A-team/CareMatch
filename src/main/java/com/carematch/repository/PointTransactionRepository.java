package com.carematch.repository;


import com.carematch.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByMember_IdOrderByCreatedAtDesc(Long memberId);
}
