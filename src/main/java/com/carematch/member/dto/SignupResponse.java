package com.carematch.member.dto;

import com.carematch.member.domain.Member;

/**
 * 회원가입 결과.
 *
 * @param memberId       생성된 회원 id
 * @param role           JOBSEEKER / FACILITY
 * @param status         회원 상태(ACTIVE)
 * @param approvalStatus 시설회원이면 PENDING, 구직자면 null
 * @param message        후속 안내 문구
 */
public record SignupResponse(
        Long memberId,
        String role,
        String status,
        String approvalStatus,
        String message
) {
    public static SignupResponse jobSeeker(Member member) {
        return new SignupResponse(member.getId(), member.getRole().name(), member.getStatus().name(),
                null, "회원가입이 완료되었습니다.");
    }

    public static SignupResponse facility(Member member) {
        return new SignupResponse(member.getId(), member.getRole().name(), member.getStatus().name(),
                "PENDING", "회원가입이 접수되었습니다. 관리자 승인 후 인재 열람/공고 등록이 가능합니다.");
    }
}
