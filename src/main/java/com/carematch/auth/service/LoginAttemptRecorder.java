package com.carematch.auth.service;

import com.carematch.config.LoginSecurityProperties;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 로그인 실패 누적/잠금 갱신을 "별도 트랜잭션"으로 커밋한다.
 * login() 이 INVALID_CREDENTIALS 예외로 롤백돼도 실패 카운트/잠금은 남아야 하므로 REQUIRES_NEW.
 */
@Component
@RequiredArgsConstructor
public class LoginAttemptRecorder {

    private final MemberRepository memberRepository;
    private final LoginSecurityProperties loginProps;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(Long memberId) {
        memberRepository.findById(memberId).ifPresent(member ->
                member.increaseLoginFail(
                        loginProps.maxFailCount(),
                        LocalDateTime.now().plusMinutes(loginProps.lockMinutes())));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(Long memberId) {
        memberRepository.findById(memberId).ifPresent(Member::resetLoginFail);
    }
}
