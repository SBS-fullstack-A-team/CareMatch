package com.carematch.point;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Member.point 컬럼을 실제 잔액으로 사용하는 PointService 구현체.
 * 차감/적립 모두 findByIdForUpdate(비관적 락)로 동시 요청 경쟁을 막는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberPointService implements PointService {

    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public boolean deduct(Long memberId, int amount, String reason) {
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        boolean ok = member.deductPoint(amount);
        log.info("[MemberPointService] deduct memberId={} amount={} reason={} result={}",
                memberId, amount, reason, ok);
        return ok;
    }

    @Override
    @Transactional
    public void credit(Long memberId, long amount, String reason) {
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.creditPoint(amount);
        log.info("[MemberPointService] credit memberId={} amount={} reason={}", memberId, amount, reason);
    }

    @Override
    @Transactional(readOnly = true)
    public long getBalance(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND))
                .getPoint();
    }
}
