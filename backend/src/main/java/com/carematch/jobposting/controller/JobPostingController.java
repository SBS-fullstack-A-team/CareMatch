package com.carematch.jobposting.controller;

import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.jobposting.dto.JobPostingDtos.CreateRequest;
import com.carematch.jobposting.dto.JobPostingDtos.DetailResponse;
import com.carematch.jobposting.dto.JobPostingDtos.MapResult;
import com.carematch.jobposting.dto.JobPostingDtos.NearbyResult;
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
import org.springframework.web.bind.annotation.PatchMapping;
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
     * sort: RECOMMENDED(기본)/LATEST/DEADLINE/PAY_DESC/PAY_ASC/VIEWS.
     */
    @GetMapping
    public PageResponse<SummaryResponse> search(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) String sido,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) List<JobType> jobTypes,
            @RequestParam(required = false) List<WorkType> workTypes,
            @RequestParam(required = false) List<WorkSchedule> workSchedules,
            @RequestParam(required = false) List<EmploymentType> employmentTypes,
            @RequestParam(required = false) List<CareGrade> careGrades,
            @RequestParam(required = false) List<MobilityStatus> mobilityStatuses,
            @RequestParam(required = false) List<PayType> payTypes,
            @RequestParam(required = false) Integer payMin,
            @RequestParam(required = false) Integer payMax,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        SearchCondition cond = new SearchCondition(
                sido, sigungu, jobTypes, workTypes, workSchedules, employmentTypes, careGrades,
                mobilityStatuses, payTypes, payMin, payMax, sort);
        return jobPostingService.search(cond, page, size, memberIdOrNull(principal));
    }

    /** "소페셜 채용정보" 상단 노출용 SPECIAL 공고 상위 3. */
    @GetMapping("/featured")
    public List<SummaryResponse> featured(@AuthenticationPrincipal CustomUserDetails principal) {
        return jobPostingService.featured(memberIdOrNull(principal));
    }

    /**
     * "내 주변 일자리" — 기준 좌표 반경 내 OPEN 공고를 가까운 순으로. 비로그인 공개.
     * radiusKm 상한 50, limit 상한 100. 프론트가 사용자 위치를 위경도로 넘긴다.
     */
    @GetMapping("/nearby")
    public List<NearbyResult> nearby(@AuthenticationPrincipal CustomUserDetails principal,
                                     @RequestParam double lat,
                                     @RequestParam double lng,
                                     @RequestParam(defaultValue = "3") double radiusKm,
                                     @RequestParam(defaultValue = "30") int limit) {
        return jobPostingService.nearby(lat, lng, radiusKm, limit, memberIdOrNull(principal));
    }

    /**
     * "지도로 보기" — 지도 뷰포트(남서/북동 모서리) 안의 OPEN 공고를 마커용으로. 비로그인 공개.
     * 결과 상한 200(최신순). 넘치면 프론트가 "확대해서 보세요" 안내.
     */
    @GetMapping("/in-bounds")
    public List<MapResult> inBounds(@AuthenticationPrincipal CustomUserDetails principal,
                                    @RequestParam double swLat,
                                    @RequestParam double swLng,
                                    @RequestParam double neLat,
                                    @RequestParam double neLng) {
        return jobPostingService.mapView(swLat, swLng, neLat, neLng, memberIdOrNull(principal));
    }

    @GetMapping("/{jobPostingId}")
    public DetailResponse detail(@AuthenticationPrincipal CustomUserDetails principal,
                                 @PathVariable Long jobPostingId) {
        return jobPostingService.getDetail(jobPostingId, memberIdOrNull(principal));
    }

    /** 비슷한 공고 (같은 시군구 + 직종, 최대 6). 비로그인 공개. */
    @GetMapping("/{jobPostingId}/similar")
    public List<SummaryResponse> similar(@AuthenticationPrincipal CustomUserDetails principal,
                                         @PathVariable Long jobPostingId) {
        return jobPostingService.similar(jobPostingId, memberIdOrNull(principal));
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

    /** 공고 마감 (OPEN → CLOSED). 작성 시설 본인만. 이미 마감이면 409. */
    @PatchMapping("/{jobPostingId}/close")
    @PreAuthorize("hasRole('FACILITY')")
    public DetailResponse close(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long jobPostingId) {
        return jobPostingService.close(principal.getMemberId(), jobPostingId);
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
