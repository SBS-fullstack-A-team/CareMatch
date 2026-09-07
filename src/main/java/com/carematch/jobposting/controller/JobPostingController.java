package com.carematch.jobposting.controller;

import com.carematch.jobposting.dto.JobPostingDtos.CreateRequest;
import com.carematch.jobposting.dto.JobPostingDtos.DetailResponse;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.jobposting.dto.JobPostingDtos.SummaryResponse;
import com.carematch.jobposting.dto.JobPostingDtos.UpdateRequest;
import com.carematch.jobposting.service.JobPostingService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 구인공고 API.
 * - 목록/상세: 비로그인 공개 (SecurityConfig permitAll)
 * - 등록/수정/삭제: ROLE_FACILITY + 승인된 시설(FacilityApprovalInterceptor)
 */
@RestController
@RequestMapping("/api/job-postings")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService jobPostingService;

    @PostMapping
    @PreAuthorize("hasRole('FACILITY')")
    public ResponseEntity<DetailResponse> create(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobPostingService.create(principal.getMemberId(), request));
    }

    @GetMapping
    public PageResponse<SummaryResponse> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return jobPostingService.listOpen(pageable);
    }

    @GetMapping("/{jobPostingId}")
    public DetailResponse detail(@PathVariable Long jobPostingId) {
        return jobPostingService.getDetail(jobPostingId);
    }

    @PutMapping("/{jobPostingId}")
    @PreAuthorize("hasRole('FACILITY')")
    public DetailResponse update(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long jobPostingId,
            @Valid @RequestBody UpdateRequest request) {
        return jobPostingService.update(principal.getMemberId(), jobPostingId, request);
    }

    @DeleteMapping("/{jobPostingId}")
    @PreAuthorize("hasRole('FACILITY')")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long jobPostingId) {
        jobPostingService.delete(principal.getMemberId(), jobPostingId);
        return ResponseEntity.noContent().build();
    }
}
