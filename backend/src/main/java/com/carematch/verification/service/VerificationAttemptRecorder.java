package com.carematch.verification.service;

import com.carematch.verification.domain.VerificationCode;
import com.carematch.verification.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 실패 시도 카운트를 "별도 트랜잭션"으로 커밋한다.
 * verifyCode 가 실패로 예외를 던져 롤백되더라도 시도 횟수는 남아야 하므로 REQUIRES_NEW.
 */
@Component
@RequiredArgsConstructor
public class VerificationAttemptRecorder {

    private final VerificationCodeRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void increaseAttempt(Long verificationCodeId) {
        repository.findById(verificationCodeId).ifPresent(VerificationCode::increaseAttempt);
    }
}
