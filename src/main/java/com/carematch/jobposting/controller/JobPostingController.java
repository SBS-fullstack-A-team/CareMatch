package com.carematch.jobposting.controller;

import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.jobposting.dto.JobPostingDtos.CreateRequest;
import com.carematch.jobposting.dto.JobPostingDtos.DetailResponse;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.jobposting.dto.JobPostingDtos.SearchCondition;
import com.carematch.jobposting.dto.JobPostingDtos.SummaryResponse;
import com.carematch.jobposting.dto.JobPostingDtos.UpdateRequest;
import com.carematch.jobposting.service.JobPostingService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    /**
     * 목록/검색. 모든 필터는 선택. 다중값은 반복 파라미터(?jobTypes=A&jobTypes=B) 또는 콤마.
     * sort: RECOMMENDED(기본)/LATEST/DEADLINE/PAY_DESC/VIEWS.
     */
    @GetMapping
    public PageResponse<SummaryResponse> search(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) String sido,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) List<JobType> jobTypes,
            @RequestParam(required = false) List<WorkType> workTypes,
            @RequestParam(required = false) List<EmploymentType> employmentTypes,
            @RequestParam(required = false) List<CareGrade> careGrades,
            @RequestParam(required = false) List<MobilityStatus> mobilityStatuses,
            @RequestParam(required = false) PayType payType,
            @RequestParam(required = false) Integer payMin,
            @RequestParam(required = false) Integer payMax,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        SearchCondition cond = new SearchCondition(
                sido, sigungu, jobTypes, workTypes, employmentTypes, careGrades, mobilityStatuses,
                payType, payMin, payMax, sort);
        return jobPostingService.search(cond, page, size, memberIdOrNull(principal));
    }

    /** "소페셜 채용정보" 상단 노출용 SPECIAL 공고 상위 3. */
    @GetMapping("/featured")
    public List<SummaryResponse> featured(@AuthenticationPrincipal CustomUserDetails principal) {
        return jobPostingService.featured(memberIdOrNull(principal));
    }

    @GetMapping("/{jobPostingId}")
    public DetailResponse detail(@AuthenticationPrincipal CustomUserDetails principal,
                                 @PathVariable Long jobPostingId) {
        return jobPostingService.getDetail(jobPostingId, memberIdOrNull(principal));
    }

    private static Long memberIdOrNull(CustomUserDetails principal) {
        return principal == null ? null : principal.getMemberId();
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
