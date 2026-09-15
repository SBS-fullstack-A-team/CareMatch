package com.carematch.member.dto;

/**
 * 회원 탈퇴 (PATCH /api/members/me/withdraw).
 * 아이디/비밀번호 계정은 본인 확인을 위해 현재 비밀번호를 받는다.
 * 소셜 전용 계정(비밀번호 없음)은 password 를 생략해도 된다 — 서버가 비밀번호가 없는
 * 계정이면 검증을 건너뛴다.
 */
public record MemberWithdrawRequest(
        String password
) {
}
