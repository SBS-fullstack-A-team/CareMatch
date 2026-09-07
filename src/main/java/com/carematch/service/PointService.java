package com.carematch.service;


import com.carematch.entity.PointTransaction;
import com.carematch.entity.PointTransactionType;
import com.carematch.repository.PointTransactionRepository;
import com.carematch.entity.Member;
import com.carematch.repository.MemberRepository;
import com.carematch.global.exception.CustomException;
import com.carematch.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointService {

    // 회원가입 축하 포인트 (데모용 임의 값 - 필요에 맞게 조정)
    private static final int SIGNUP_BONUS = 10_000;

    private final MemberRepository memberRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Transactional
    public void grantSignupBonus(Member member) {
        member.chargePoint(SIGNUP_BONUS);
        pointTransactionRepository.save(
                PointTransaction.builder()
                        .member(member)
                        .type(PointTransactionType.GRANT)
                        .amount(SIGNUP_BONUS)
                        .description("회원가입 축하 포인트")
                        .build()
        );
    }

    @Transactional
    public void use(Long memberId, int amount, String description) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        if (!member.hasEnoughPoint(amount)) {
            throw new CustomException(ErrorCode.INSUFFICIENT_POINT);
        }

        member.usePoint(amount);
        pointTransactionRepository.save(
                PointTransaction.builder()
                        .member(member)
                        .type(PointTransactionType.USE)
                        .amount(amount)
                        .description(description)
                        .build()
        );
    }

    /** 실제 PG 연동 없는 가짜 결제 — 바로 포인트를 충전한다. */
    @Transactional
    public void charge(Long memberId, int amount, String description) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        member.chargePoint(amount);
        pointTransactionRepository.save(
                PointTransaction.builder()
                        .member(member)
                        .type(PointTransactionType.CHARGE)
                        .amount(amount)
                        .description(description)
                        .build()
        );
    }
}
