package com.carematch.jobposting.controller;

import com.carematch.jobposting.dto.JobPostingDraftDtos.DraftResponse;
import com.carematch.jobposting.dto.JobPostingDraftDtos.DraftSummary;
import com.carematch.jobposting.dto.JobPostingDraftDtos.SaveRequest;
import com.carematch.jobposting.service.JobPostingDraftService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 구인공고 임시저장. 승인된 시설회원 본인만 (ROLE_FACILITY + FacilityApprovalInterceptor).
 * 발행은 별도 — 폼 완성 후 {@code POST /api/job-postings} 등록 → 이 임시저장 {@code DELETE}.
 */
@RestController
@RequestMapping("/api/job-posting-drafts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FACILITY')")
public class JobPostingDraftController {

    private final JobPostingDraftService draftService;

    @PostMapping
    public ResponseEntity<DraftResponse> create(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody SaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(draftService.create(principal.getMemberId(), request));
    }

    @GetMapping
    public List<DraftSummary> list(@AuthenticationPrincipal CustomUserDetails principal) {
        return draftService.list(principal.getMemberId());
    }

    @GetMapping("/{draftId}")
    public DraftResponse get(@AuthenticationPrincipal CustomUserDetails principal,
                             @PathVariable Long draftId) {
        return draftService.get(principal.getMemberId(), draftId);
    }

    @PutMapping("/{draftId}")
    public DraftResponse update(@AuthenticationPrincipal CustomUserDetails principal,
                                @PathVariable Long draftId,
                                @Valid @RequestBody SaveRequest request) {
        return draftService.update(principal.getMemberId(), draftId, request);
    }

    @DeleteMapping("/{draftId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal CustomUserDetails principal,
                       @PathVariable Long draftId) {
        draftService.delete(principal.getMemberId(), draftId);
    }
}
