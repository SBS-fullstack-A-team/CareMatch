package com.carematch.controller;


import com.carematch.service.JobPostingService;
import com.carematch.dto.JobPostingCreateRequest;
import com.carematch.dto.JobPostingResponse;
import com.carematch.dto.JobPostingUpdateRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/job-postings")
public class JobPostingController {

    private final JobPostingService jobPostingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<JobPostingResponse> create(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody JobPostingCreateRequest request) {
        return ApiResponse.success(jobPostingService.create(userDetails.getMemberId(), request));
    }

    // 비로그인도 접근 가능 (SecurityConfig permitAll). 로그인한 구직자면 매칭 스코어가 함께 내려간다.
    @GetMapping
    public ApiResponse<Page<JobPostingResponse>> search(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String jobType,
            Pageable pageable) {
        Long viewerMemberId = userDetails == null ? null : userDetails.getMemberId();
        return ApiResponse.success(jobPostingService.search(viewerMemberId, region, jobType, pageable));
    }

    @GetMapping("/{jobPostingId}")
    public ApiResponse<JobPostingResponse> getDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobPostingId) {
        Long viewerMemberId = userDetails == null ? null : userDetails.getMemberId();
        return ApiResponse.success(jobPostingService.getDetail(viewerMemberId, jobPostingId));
    }

    @PutMapping("/{jobPostingId}")
    public ApiResponse<JobPostingResponse> update(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobPostingId,
            @Valid @RequestBody JobPostingUpdateRequest request) {
        return ApiResponse.success(jobPostingService.update(userDetails.getMemberId(), jobPostingId, request));
    }

    @DeleteMapping("/{jobPostingId}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobPostingId) {
        jobPostingService.delete(userDetails.getMemberId(), jobPostingId);
        return ApiResponse.success();
    }
}
