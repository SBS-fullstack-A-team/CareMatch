package com.carematch.point;

/**
 * 포인트 시스템 추상화.
 *
 * ⚠️ 포인트 정책(적립/차감 규칙, 충전 방식, 잔액 관리, 동시성 락)은 아직 미확정.
 * 이번 작업 범위는 "연락처 열람 흐름에 필요한 자리"만 만드는 것이다.
 * 실제 잔액 검증/차감/트랜잭션은 정책 확정 후 이 인터페이스의 구현체에서 처리한다.
 *
 * 현재 구현체: StubPointService (항상 차감 성공 반환)
 */
public interface PointService {

    /**
     * 지정 금액만큼 차감을 시도한다.
     *
     * @param memberId 차감 대상 회원(시설 회원)
     * @param amount   차감 포인트
     * @param reason   차감 사유 (예: "CONTACT_UNLOCK:jobSeekerProfileId=42")
     * @return 차감 성공 여부. 스텁은 항상 true.
     */
    boolean deduct(Long memberId, int amount, String reason);

    /**
     * 현재 보유 포인트 조회 (마이페이지 표시용).
     * 스텁은 고정 더미 값을 반환한다.
     */
    long getBalance(Long memberId);
}
