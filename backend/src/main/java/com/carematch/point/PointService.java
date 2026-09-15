package com.carematch.point;

/**
 * 포인트 시스템 추상화. Member.point 컬럼을 실제 잔액으로 사용하는
 * MemberPointService 가 유일한 구현체다(동시성은 비관적 락으로 처리).
 */
public interface PointService {

    /**
     * 지정 금액만큼 차감을 시도한다.
     *
     * @param memberId 차감 대상 회원
     * @param amount   차감 포인트
     * @param reason   차감 사유 (예: "CONTACT_UNLOCK:jobSeekerProfileId=42")
     * @return 차감 성공 여부. 잔액 부족이면 false(차감하지 않음).
     */
    boolean deduct(Long memberId, int amount, String reason);

    /**
     * 지정 금액만큼 적립한다. 포트원 결제 검증 성공 후 PointChargeService 가 호출한다.
     *
     * @param memberId 적립 대상 회원
     * @param amount   적립 포인트
     * @param reason   적립 사유 (예: "POINT_CHARGE:paymentId=...")
     */
    void credit(Long memberId, long amount, String reason);

    /** 현재 보유 포인트 조회 (마이페이지 표시용). */
    long getBalance(Long memberId);
}
