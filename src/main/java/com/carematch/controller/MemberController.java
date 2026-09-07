package com.carematch.controller;


import com.carematch.service.MemberService;
import com.carematch.dto.FacilityUpdateRequest;
import com.carematch.dto.LoginRequest;
import com.carematch.dto.LoginResponse;
import com.carematch.dto.MemberResponse;
import com.carematch.dto.SignUpRequest;
import com.carematch.global.ApiResponse;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping("/api/auth/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MemberResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        return ApiResponse.success(memberService.signUp(request));
    }

    @PostMapping("/api/auth/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(memberService.login(request));
    }

    @GetMapping("/api/members/me")
    public ApiResponse<MemberResponse> getMyInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(memberService.getMyInfo(userDetails.getMemberId()));
    }

    /** 시설 회원 프로필 등록/수정. 구인공고 등록 전 필수. */
    @PatchMapping("/api/members/me/facility")
    public ApiResponse<MemberResponse> updateFacility(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FacilityUpdateRequest request) {
        return ApiResponse.success(memberService.updateFacilityProfile(userDetails.getMemberId(), request));
    }
}
