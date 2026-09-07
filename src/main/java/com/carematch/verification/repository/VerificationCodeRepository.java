package com.carematch.verification.repository;

import com.carematch.verification.domain.VerificationChannel;
import com.carematch.verification.domain.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    List<VerificationCode> findByChannelAndTarget(VerificationChannel channel, String target);

    Optional<VerificationCode> findFirstByChannelAndTargetAndVerifiedFalseOrderByCreatedAtDesc(
            VerificationChannel channel, String target);

    boolean existsByChannelAndTargetAndVerifiedTrue(VerificationChannel channel, String target);
}
