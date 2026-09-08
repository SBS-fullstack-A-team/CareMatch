package com.carematch.application.controller;

import com.carematch.application.domain.ApplicationStatus;
import com.carematch.application.dto.ApplicationDtos.ApplicantResponse;
import com.carematch.application.dto.ApplicationDtos.ApplyRequest;
import com.carematch.application.dto.ApplicationDtos.CreatedResponse;
import com.carematch.application.dto.ApplicationDtos.DecisionRequest;
import com.carematch.application.dto.ApplicationDtos.MyApplicationResponse;
import com.carematch.application.service.ApplicationService;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 구직 지원(구직신청).
 * - 지원/취소/내 지원목록: ROLE_JOBSEEKER
 * - 지원자 목록/수락·반려: ROLE_FACILITY (+ 공고 작성 시설 본인)
 */
@RestController
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/api/job-postings/{jobPostingId}/applications")
    @PreAuthorize("hasRole('JOBSEEKER')")
    public ResponseEntity<CreatedResponse> apply(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long jobPostingId,
            @Valid @RequestBody(required = false) ApplyRequest request) {
        ApplyRequest body = request == null ? new ApplyRequest(null) : request;
        Long id = applicationService.apply(principal.getMemberId(), jobPostingId, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CreatedResponse(id));
    }

    @GetMapping("/api/job-postings/{jobPostingId}/applications")
    @PreAuthorize("hasRole('FACILITY')")
    public PageResponse<ApplicantResponse> applicants(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long jobPostingId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return applicationService.applicantsOfPosting(principal.getMemberId(), jobPostingId, status, page, size);
    }

    @GetMapping("/api/members/me/applications")
    @PreAuthorize("hasRole('JOBSEEKER')")
    public PageResponse<MyApplicationResponse> myApplications(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return applicationService.myApplications(principal.getMemberId(), status, page, size);
    }

    @PatchMapping("/api/applications/{applicationId}/cancel")
    @PreAuthorize("hasRole('JOBSEEKER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal CustomUserDetails principal,
                       @PathVariable Long applicationId) {
        applicationService.cancel(principal.getMemberId(), applicationId);
    }

    @PatchMapping("/api/applications/{applicationId}/status")
    @PreAuthorize("hasRole('FACILITY')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decide(@AuthenticationPrincipal CustomUserDetails principal,
                       @PathVariable Long applicationId,
                       @Valid @RequestBody DecisionRequest request) {
        applicationService.decide(principal.getMemberId(), applicationId, request.status());
    }
}
