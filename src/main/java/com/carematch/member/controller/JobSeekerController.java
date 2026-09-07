package com.carematch.member.controller;

import com.carematch.contact.dto.ContactUnlockResponse;
import com.carematch.contact.service.ContactUnlockService;
import com.carematch.member.dto.JobSeekerProfileResponse;
import com.carematch.member.service.JobSeekerProfileQueryService;
import com.carematch.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인재(구직자) 조회 및 연락처 열람.
 * 시설회원 접근은 SecurityFilterChain(role) + FacilityApprovalInterceptor(승인여부) 2중 통제.
 */
@RestController
@RequestMapping("/api/jobseekers")
@RequiredArgsConstructor
public class JobSeekerController {

    private final JobSeekerProfileQueryService profileQueryService;
    private final ContactUnlockService contactUnlockService;

    /** 내 구직자 프로필 (본인, 전체 공개) */
    @GetMapping("/me")
    @PreAuthorize("hasRole('JOBSEEKER')")
    public JobSeekerProfileResponse myProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return profileQueryService.getMine(principal.getMemberId());
    }

    /** 인재 상세 (시설회원/관리자). 연락처·거주지는 기본 마스킹, 열람 이력 있으면 언마스크 */
    @GetMapping("/{profileId}")
    @PreAuthorize("hasAnyRole('FACILITY','ADMIN')")
    public JobSeekerProfileResponse detail(@PathVariable Long profileId,
                                           @AuthenticationPrincipal CustomUserDetails principal) {
        return profileQueryService.getForFacility(profileId, principal.getMemberId());
    }

    /**
     * 연락처 열람하기.
     * - 이미 열람 이력이 있으면 무료(free=true)
     * - 없으면 (스텁)포인트 차감 후 이력 저장
     * - 대상이 취업완료(EMPLOYED)면 409 로 차단
     */
    @PostMapping("/{profileId}/contact/unlock")
    @PreAuthorize("hasRole('FACILITY')")
    public ContactUnlockResponse unlockContact(@PathVariable Long profileId,
                                               @AuthenticationPrincipal CustomUserDetails principal) {
        return contactUnlockService.unlock(principal.getMemberId(), profileId);
    }
}
