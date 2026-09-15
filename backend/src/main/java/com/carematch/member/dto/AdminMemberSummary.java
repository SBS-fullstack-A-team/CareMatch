package com.carematch.member.dto;

import com.carematch.member.domain.Member;

import java.time.LocalDateTime;

/** 관리자 회원관리 목록/상세 한 줄. */
public record AdminMemberSummary(
        Long id,
        String loginId,
        String name,
        String email,
        String phone,
        String role,
        String status,
        boolean verified,
        long point,
        LocalDateTime createdAt
) {
    public static AdminMemberSummary from(Member m) {
        return new AdminMemberSummary(
                m.getId(),
                m.getLoginId(),
                m.getName(),
                m.getEmail(),
                m.getPhone(),
                m.isRoleSelected() ? m.getRole().name() : null,
                m.getStatus().name(),
                m.isVerified(),
                m.getPoint(),
                m.getCreatedAt());
    }
}
