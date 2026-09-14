package com.carematch.member.controller;

import com.carematch.certificate.domain.CertificateType;
import com.carematch.contact.dto.ContactUnlockResponse;
import com.carematch.contact.service.ContactUnlockService;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.member.domain.CareTask;
import com.carematch.member.domain.Gender;
import com.carematch.member.dto.JobSeekerProfileResponse;
import com.carematch.member.dto.JobSeekerProfileUpdateRequest;
import com.carematch.member.dto.TalentSearchDtos.CareerBucket;
import com.carematch.member.dto.TalentSearchDtos.FacetsResponse;
import com.carematch.member.dto.TalentSearchDtos.SearchCondition;
import com.carematch.member.dto.TalentSearchDtos.TalentSummary;
import com.carematch.member.service.JobSeekerProfileQueryService;
import com.carematch.member.service.JobSeekerProfileService;
import com.carematch.member.service.TalentSearchService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    private final JobSeekerProfileService profileService;
    private final ContactUnlockService contactUnlockService;
    private final TalentSearchService talentSearchService;

    /** 내 구직자 프로필 (본인, 전체 공개) */
    @GetMapping("/me")
    @PreAuthorize("hasRole('JOBSEEKER')")
    public JobSeekerProfileResponse myProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return profileQueryService.getMine(principal.getMemberId());
    }

    /** 내 구직자 프로필 수정 (거주지·자기소개·취업상태·희망 근무조건) */
    @PutMapping("/me")
    @PreAuthorize("hasRole('JOBSEEKER')")
    public JobSeekerProfileResponse updateMyProfile(@AuthenticationPrincipal CustomUserDetails principal,
                                                   @Valid @RequestBody JobSeekerProfileUpdateRequest request) {
        return profileService.updateMine(principal.getMemberId(), request);
    }

    /**
     * 인재 검색 목록 (승인 시설회원 / 관리자). 필터·정렬은 쿼리 파라미터.
     * 지역/직종/근무형태/급여/자격증은 구직자 희망·보유 값 기준. 다중값은 반복 파라미터.
     * 정렬 sort: LATEST(기본)/CAREER_DESC/CAREER_ASC.
     * 시설회원이면 각 카드에 "그 시설 OPEN 공고 중 최고 매칭 점수"(matchingScore)가 채워진다.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('FACILITY','ADMIN')")
    public PageResponse<TalentSummary> search(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) java.util.List<JobType> desiredJobTypes,
            @RequestParam(required = false) WorkType desiredWorkType,
            @RequestParam(required = false) java.util.List<WorkSchedule> desiredWorkSchedules,
            @RequestParam(required = false) java.util.List<String> sidos,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) java.util.List<PayType> payTypes,
            @RequestParam(required = false) Integer payMax,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) java.util.List<CareerBucket> careerBuckets,
            @RequestParam(required = false) java.util.List<CareTask> availableTasks,
            @RequestParam(required = false) java.util.List<EmploymentType> desiredEmploymentTypes,
            @RequestParam(required = false) java.util.List<CertificateType> certificateTypes,
            @RequestParam(required = false) Boolean seekingOnly,
            @RequestParam(required = false) Integer updatedWithinDays,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        boolean isFacility = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACILITY"));
        SearchCondition cond = new SearchCondition(
                desiredJobTypes, desiredWorkType, desiredWorkSchedules, sidos, sigungu, payTypes, payMax,
                gender, careerBuckets, availableTasks, desiredEmploymentTypes, certificateTypes,
                seekingOnly, updatedWithinDays, sort);
        return talentSearchService.search(cond, page, size, principal.getMemberId(), isFacility);
    }

    /**
     * 좌측 필터 패널의 옵션별 결과 인원수. 검색과 같은 필터 파라미터를 받되 sort/page/size 는 없다.
     * 각 축은 그 축 자신의 선택은 제외하고 센다(JobPostingController#facets 와 동일 규칙).
     * 자격증 축은 이번 범위에서 제공하지 않는다.
     */
    @GetMapping("/facets")
    @PreAuthorize("hasAnyRole('FACILITY','ADMIN')")
    public FacetsResponse facets(
            @RequestParam(required = false) java.util.List<JobType> desiredJobTypes,
            @RequestParam(required = false) WorkType desiredWorkType,
            @RequestParam(required = false) java.util.List<WorkSchedule> desiredWorkSchedules,
            @RequestParam(required = false) java.util.List<String> sidos,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) java.util.List<PayType> payTypes,
            @RequestParam(required = false) Integer payMax,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) java.util.List<CareerBucket> careerBuckets,
            @RequestParam(required = false) java.util.List<CareTask> availableTasks,
            @RequestParam(required = false) java.util.List<EmploymentType> desiredEmploymentTypes,
            @RequestParam(required = false) java.util.List<CertificateType> certificateTypes,
            @RequestParam(required = false) Boolean seekingOnly,
            @RequestParam(required = false) Integer updatedWithinDays) {
        SearchCondition cond = new SearchCondition(
                desiredJobTypes, desiredWorkType, desiredWorkSchedules, sidos, sigungu, payTypes, payMax,
                gender, careerBuckets, availableTasks, desiredEmploymentTypes, certificateTypes,
                seekingOnly, updatedWithinDays, null);
        return talentSearchService.facets(cond);
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
