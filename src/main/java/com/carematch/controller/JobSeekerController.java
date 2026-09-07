package com.carematch.controller;


import com.carematch.service.JobSeekerService;
import com.carematch.dto.JobSeekerContactResponse;
import com.carematch.dto.JobSeekerCreateRequest;
import com.carematch.dto.JobSeekerResponse;
import com.carematch.global.ApiResponse;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/job-seekers")
public class JobSeekerController {

    private final JobSeekerService jobSeekerService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<JobSeekerResponse> register(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody JobSeekerCreateRequest request) {
        return ApiResponse.success(jobSeekerService.register(userDetails.getMemberId(), request));
    }

    // 비로그인도 접근 가능. 로그인한 구인자면 본인 공고 기준 매칭 스코어가 함께 내려간다.
    @GetMapping
    public ApiResponse<Page<JobSeekerResponse>> list(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Pageable pageable) {
        Long viewerMemberId = userDetails == null ? null : userDetails.getMemberId();
        return ApiResponse.success(jobSeekerService.list(viewerMemberId, pageable));
    }

    @GetMapping("/{jobSeekerId}")
    public ApiResponse<JobSeekerResponse> getDetail(@PathVariable Long jobSeekerId) {
        return ApiResponse.success(jobSeekerService.getDetail(jobSeekerId));
    }

    // 연락처 열람 — 인증 필수 (SecurityConfig에서 permitAll 예외 처리됨)
    @GetMapping("/{jobSeekerId}/contact")
    public ApiResponse<JobSeekerContactResponse> getContact(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobSeekerId) {
        return ApiResponse.success(jobSeekerService.getContactInfo(userDetails.getMemberId(), jobSeekerId));
    }

    @DeleteMapping("/{jobSeekerId}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobSeekerId) {
        jobSeekerService.delete(userDetails.getMemberId(), jobSeekerId);
        return ApiResponse.success();
    }
}
