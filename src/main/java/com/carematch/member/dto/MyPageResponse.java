package com.carematch.member.dto;

/**
 * 마이페이지 상단 요약.
 *
 * @param memberId       회원 id
 * @param name           이름
 * @param email          이메일
 * @param role           JOBSEEKER / FACILITY / ADMIN
 * @param membershipType 멤버십 유형(현재 BASIC 고정, 2차 확장 대비)
 * @param point          보유 포인트 (PointService 스텁 값)
 * @param employmentStatus 구직자면 SEEKING/EMPLOYED, 아니면 null
 * @param facilityApprovalStatus 시설회원이면 PENDING/APPROVED/REJECTED, 아니면 null
 */
public record MyPageResponse(
        Long memberId,
        String name,
        String email,
        String role,
        String membershipType,
        long point,
        String employmentStatus,
        String facilityApprovalStatus
) {
}
