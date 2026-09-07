package com.carematch.controller;


import com.carematch.service.ApplicationService;
import com.carematch.dto.ApplicationCreateRequest;
import com.carematch.dto.ApplicationResponse;
import com.carematch.dto.ApplicationStatusUpdateRequest;
import com.carematch.global.ApiResponse;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/api/job-postings/{jobPostingId}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ApplicationResponse> apply(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobPostingId,
            @RequestBody ApplicationCreateRequest request) {
        return ApiResponse.success(
                applicationService.apply(userDetails.getMemberId(), jobPostingId, request));
    }

    @GetMapping("/api/members/me/applications")
    public ApiResponse<List<ApplicationResponse>> getMyApplications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(applicationService.getMyApplications(userDetails.getMemberId()));
    }

    @GetMapping("/api/job-postings/{jobPostingId}/applications")
    public ApiResponse<List<ApplicationResponse>> getApplicationsForPosting(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobPostingId) {
        return ApiResponse.success(
                applicationService.getApplicationsForPosting(userDetails.getMemberId(), jobPostingId));
    }

    @PatchMapping("/api/applications/{applicationId}/status")
    public ApiResponse<ApplicationResponse> updateStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long applicationId,
            @Valid @RequestBody ApplicationStatusUpdateRequest request) {
        return ApiResponse.success(
                applicationService.updateStatus(userDetails.getMemberId(), applicationId, request.status()));
    }

    @DeleteMapping("/api/applications/{applicationId}")
    public ApiResponse<Void> cancel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long applicationId) {
        applicationService.cancel(userDetails.getMemberId(), applicationId);
        return ApiResponse.success();
    }
}
