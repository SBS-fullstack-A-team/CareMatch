package com.carematch.controller;


import com.carematch.service.MemberService;
import com.carematch.dto.MemberResponse;
import com.carematch.global.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 시설(구인자) 회원 승인/반려 — ROLE_ADMIN만 접근 가능 (SecurityConfig에서 제한). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/members")
public class AdminMemberController {

    private final MemberService memberService;

    @PatchMapping("/{memberId}/approve")
    public ApiResponse<MemberResponse> approve(@PathVariable Long memberId) {
        return ApiResponse.success(memberService.approve(memberId));
    }

    @PatchMapping("/{memberId}/reject")
    public ApiResponse<MemberResponse> reject(@PathVariable Long memberId) {
        return ApiResponse.success(memberService.reject(memberId));
    }
}
