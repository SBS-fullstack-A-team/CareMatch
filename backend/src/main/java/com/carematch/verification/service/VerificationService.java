package com.carematch.verification.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.verification.domain.VerificationChannel;
import com.carematch.verification.domain.VerificationCode;
import com.carematch.verification.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 이메일/휴대폰 인증코드 발송·검증.
 * 실제 발송(SMS/메일)은 MVP 에서 목업 — 로그로만 출력한다.
 * 회원가입 시 "이메일 또는 휴대폰 중 하나"의 인증 완료가 필수.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private static final int CODE_TTL_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final VerificationCodeRepository repository;
    private final VerificationAttemptRecorder attemptRecorder;
    private final Environment environment;

    @Transactional
    public SentCode sendCode(VerificationChannel channel, String rawTarget) {
        String target = normalize(channel, rawTarget);

        // 기존 미인증 코드는 만료 처리 (재발송 시 최신 것만 유효)
        List<VerificationCode> existing = repository.findByChannelAndTarget(channel, target);
        existing.stream().filter(vc -> !vc.isVerified()).forEach(VerificationCode::expireNow);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES);
        repository.save(VerificationCode.builder()
                .channel(channel)
                .target(target)
                .code(code)
                .expiresAt(expiresAt)
                .build());

        // 목업 발송
        log.info("[Verification][MOCK-SEND] channel={} target={} code={} (유효 {}분)",
                channel, maskTarget(channel, target), code, CODE_TTL_MINUTES);

        String devHint = isLocalProfile() ? code : null;
        return new SentCode(channel, target, expiresAt, devHint);
    }

    @Transactional
    public boolean verifyCode(VerificationChannel channel, String rawTarget, String code) {
        String target = normalize(channel, rawTarget);
        VerificationCode vc = repository
                .findFirstByChannelAndTargetAndVerifiedFalseOrderByCreatedAtDesc(channel, target)
                .orElseThrow(() -> new BusinessException(ErrorCode.VERIFICATION_CODE_NOT_FOUND));

        if (vc.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new BusinessException(ErrorCode.VERIFICATION_ATTEMPT_EXCEEDED);
        }
        if (vc.isExpired(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_EXPIRED);
        }
        if (!vc.getCode().equals(code)) {
            // 실패 시도 카운트는 롤백되면 안 되므로 별도 트랜잭션으로 기록
            attemptRecorder.increaseAttempt(vc.getId());
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_MISMATCH);
        }
        vc.markVerified();
        return true;
    }

    @Transactional(readOnly = true)
    public boolean isVerified(VerificationChannel channel, String rawTarget) {
        return repository.existsByChannelAndTargetAndVerifiedTrue(channel, normalize(channel, rawTarget));
    }

    /** 회원가입 서비스에서 호출: 인증 안 됐으면 예외. */
    @Transactional(readOnly = true)
    public void assertVerified(VerificationChannel channel, String rawTarget) {
        if (!isVerified(channel, rawTarget)) {
            throw new BusinessException(ErrorCode.VERIFICATION_REQUIRED, channel + ":" + rawTarget);
        }
    }

    private String normalize(VerificationChannel channel, String target) {
        if (target == null) {
            return null;
        }
        return channel == VerificationChannel.PHONE ? target.replaceAll("[^0-9]", "") : target.trim().toLowerCase();
    }

    private boolean isLocalProfile() {
        for (String p : environment.getActiveProfiles()) {
            if (p.equalsIgnoreCase("local")) {
                return true;
            }
        }
        return environment.getActiveProfiles().length == 0; // 기본(local)
    }

    private String maskTarget(VerificationChannel channel, String target) {
        if (target == null || target.length() < 4) {
            return "***";
        }
        return target.substring(0, 3) + "***";
    }

    public record SentCode(VerificationChannel channel, String target,
                           LocalDateTime expiresAt, String devCodeHint) {
    }
}
