package com.carematch.jobposting.controller;

import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.jobposting.dto.JobPostingDtos.SummaryResponse;
import com.carematch.jobposting.service.ScrapService;
import com.carematch.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 구인공고 스크랩(찜). 인증 필요 (SecurityConfig anyRequest().authenticated()).
 */
@RestController
@RequiredArgsConstructor
public class ScrapController {

    private final ScrapService scrapService;

    @PostMapping("/api/job-postings/{jobPostingId}/scrap")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void scrap(@AuthenticationPrincipal CustomUserDetails principal,
                      @PathVariable Long jobPostingId) {
        scrapService.scrap(principal.getMemberId(), jobPostingId);
    }

    @DeleteMapping("/api/job-postings/{jobPostingId}/scrap")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unscrap(@AuthenticationPrincipal CustomUserDetails principal,
                        @PathVariable Long jobPostingId) {
        scrapService.unscrap(principal.getMemberId(), jobPostingId);
    }

    @GetMapping("/api/members/me/scraps")
    public PageResponse<SummaryResponse> myScraps(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return scrapService.myScraps(principal.getMemberId(), page, size);
    }
}
