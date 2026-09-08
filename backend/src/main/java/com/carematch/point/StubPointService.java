package com.carematch.point;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * PointService 스텁. 포인트 정책 확정 전까지 사용.
 * - deduct(): 항상 true (차감 성공했다고 가정)
 * - getBalance(): 고정 더미 값
 * 정책이 정해지면 이 클래스를 실제 구현체로 교체 (인터페이스는 그대로).
 */
@Slf4j
@Service
public class StubPointService implements PointService {

    /** 연락처 열람 기본 차감 포인트(목업에서의 표시용 상수). UI 목업의 "300P" 기준. */
    public static final int CONTACT_UNLOCK_COST = 300;

    private static final long DUMMY_BALANCE = 9_999L;

    @Override
    public boolean deduct(Long memberId, int amount, String reason) {
        log.info("[StubPointService] deduct memberId={} amount={} reason={} -> always success", memberId, amount, reason);
        return true;
    }

    @Override
    public long getBalance(Long memberId) {
        return DUMMY_BALANCE;
    }
}
