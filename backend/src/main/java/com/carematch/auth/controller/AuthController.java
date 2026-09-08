package com.carematch.auth.controller;

import com.carematch.auth.dto.AuthDtos.LoginRequest;
import com.carematch.auth.dto.AuthDtos.LogoutRequest;
import com.carematch.auth.dto.AuthDtos.RefreshRequest;
import com.carematch.auth.dto.AuthDtos.TokenResponse;
import com.carematch.auth.service.AuthService;
import com.carematch.member.domain.Member;
import com.carematch.member.dto.SocialRoleSelectionRequest;
import com.carematch.member.service.MemberService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final MemberService memberService;

    /** 아이디/비밀번호 로그인 → Access + Refresh 발급 */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.loginId(), request.password()));
    }

    /** Refresh Token 으로 Access Token 재발급 (Refresh rotation 포함) */
    @PostMapping("/reissue")
    public ResponseEntity<TokenResponse> reissue(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.reissue(request.refreshToken()));
    }

    /** 로그아웃 → 제시된 Refresh Token 무효화 */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    /**
     * 소셜 최초 로그인 후 회원 유형 확정.
     * GUEST 권한(유형 미선택) 상태에서만 호출. 확정 후 갱신된 토큰을 재발급한다.
     */
    @PostMapping("/social/select-role")
    public ResponseEntity<TokenResponse> selectSocialRole(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody SocialRoleSelectionRequest request) {
        Member member = memberService.selectSocialRole(principal.getMemberId(), request);
        return ResponseEntity.ok(authService.issueTokens(member));
    }
}
