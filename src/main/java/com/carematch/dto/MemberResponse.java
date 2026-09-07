package com.carematch.dto;

import com.carematch.entity.FacilityType;
import com.carematch.entity.Member;
import com.carematch.entity.MemberStatus;
import com.carematch.entity.Role;

public record MemberResponse(
        Long id,
        String email,
        String name,
        String phone,
        Role role,
        MemberStatus status,
        Integer pointBalance,
        // 시설 프로필 (EMPLOYER 전용, 미작성 시 null)
        String facilityName,
        FacilityType facilityType,
        String managerName,
        String managerPosition,
        String facilityAddress
) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getName(),
                member.getPhone(),
                member.getRole(),
                member.getStatus(),
                member.getPointBalance(),
                member.getFacilityName(),
                member.getFacilityType(),
                member.getManagerName(),
                member.getManagerPosition(),
                member.getFacilityAddress()
        );
    }
}
