package com.carematch.member.controller;

import com.carematch.member.dto.DisplayPreferenceDtos;
import com.carematch.member.dto.FacilitySignupRequest;
import com.carematch.member.dto.JobSeekerSignupRequest;
import com.carematch.member.dto.MyPageResponse;
import com.carematch.member.dto.PhoneUpdateRequest;
import com.carematch.member.dto.SignupResponse;
import com.carematch.member.service.MemberDisplayPreferenceService;
import com.carematch.member.service.MemberService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final MemberDisplayPreferenceService displayPreferenceService;

    /** 구직자(개인) 회원가입 */
    @PostMapping("/jobseekers")
    public ResponseEntity<SignupResponse> signupJobSeeker(@Valid @RequestBody JobSeekerSignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.registerJobSeeker(request));
    }

    /** 시설(기업) 회원가입 — 승인 대기(PENDING) 상태로 생성 */
    @PostMapping("/facilities")
    public ResponseEntity<SignupResponse> signupFacility(@Valid @RequestBody FacilitySignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.registerFacility(request));
    }

    /** 아이디/이메일 중복 확인 (둘 중 하나 이상 쿼리로 전달) */
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> checkExists(
            @RequestParam(required = false) String loginId,
            @RequestParam(required = false) String email) {
        Map<String, Boolean> body = new java.util.LinkedHashMap<>();
        if (loginId != null) {
            body.put("loginIdAvailable", memberService.isLoginIdAvailable(loginId));
        }
        if (email != null) {
            body.put("emailAvailable", memberService.isEmailAvailable(email));
        }
        return ResponseEntity.ok(body);
    }

    /** 마이페이지 상단 요약 (보유 포인트, 회원 유형 등) */
    @GetMapping("/me")
    public ResponseEntity<MyPageResponse> myPage(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(memberService.getMyPage(principal.getMemberId()));
    }

    /** 내 화면 표시 설정 조회 (쉬운 화면 모드 / 글자 크기). 로그인한 모든 회원. */
    @GetMapping("/me/display-preference")
    public ResponseEntity<DisplayPreferenceDtos.Response> getDisplayPreference(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(displayPreferenceService.get(principal.getMemberId()));
    }

    /** 내 화면 표시 설정 변경. 두 값 모두 필수(전체 교체). */
    @PutMapping("/me/display-preference")
    public ResponseEntity<DisplayPreferenceDtos.Response> updateDisplayPreference(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody DisplayPreferenceDtos.UpdateRequest request) {
        return ResponseEntity.ok(displayPreferenceService.update(principal.getMemberId(), request));
    }

    /**
     * 내 전화번호 등록/변경. 소셜(카카오 등) 가입자는 가입 시 전화번호가 없어 여기서 나중에 입력한다.
     * 저장만 할 뿐 인증은 안 됨 — 인증은 /api/verifications/{send,verify}를 이 번호로 별도 진행.
     */
    @PutMapping("/me/phone")
    public ResponseEntity<Void> updatePhone(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody PhoneUpdateRequest request) {
        memberService.updatePhone(principal.getMemberId(), request.phone());
        return ResponseEntity.noContent().build();
    }
}
