package com.carematch.jobposting.dto;

import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.CognitiveStatus;
import com.carematch.jobposting.domain.ElderGender;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MealStatus;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.Member;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.function.Function;

/**
 * 구인공고 요청/응답 DTO 모음.
 * enum 필드는 Jackson 이 문자열로 매핑하고, 잘못된 값은 GlobalExceptionHandler 가 400 으로 처리한다.
 */
public final class JobPostingDtos {

    private JobPostingDtos() {
    }

    private static final int NEW_DAYS = 3;
    private static final int CLOSING_SOON_DAYS = 7;

    // =====================================================================
    // 검색 조건
    // =====================================================================

    /**
     * 목록/검색 필터. 모든 필드 선택. 상태는 서버가 OPEN 으로 고정.
     * 급여 범위(payMin/payMax)는 payType 을 함께 지정하지 않으면 시급·월급이 섞여 비교되니
     * 프론트에서 payType 과 함께 보내는 것을 권장.
     */
    public record SearchCondition(
            String sido,
            String sigungu,
            List<JobType> jobTypes,
            List<WorkType> workTypes,
            List<EmploymentType> employmentTypes,
            List<CareGrade> careGrades,
            List<MobilityStatus> mobilityStatuses,
            PayType payType,
            Integer payMin,
            Integer payMax,
            /** RECOMMENDED(기본) / LATEST / DEADLINE / PAY_DESC / VIEWS */
            String sort
    ) {
    }

    // =====================================================================
    // 요청
    // =====================================================================

    public record CreateRequest(
            @NotBlank String title,
            @NotNull JobType jobType,
            String description,

            @NotNull WorkType workType,
            @NotNull EmploymentType employmentType,
            String employmentTypeNote,
            @NotBlank String workDays,
            @NotNull LocalTime workStartTime,
            @NotNull LocalTime workEndTime,
            @NotNull PayType payType,
            @NotNull @Positive Integer payAmount,
            @NotNull @Positive Integer recruitCount,
            @NotNull @FutureOrPresent LocalDate deadline,

            @NotBlank String sido,
            @NotBlank String sigungu,
            String addressDetail,

            @NotNull CareGrade careGrade,
            @NotNull ElderGender elderGender,
            String elderAgeRange,
            @NotNull MobilityStatus mobilityStatus,
            @NotNull MealStatus mealStatus,
            @NotNull CognitiveStatus cognitiveStatus,

            List<String> duties,
            List<String> requiredDocuments,

            /** null 이면 NORMAL. */
            ExposureType exposureType
    ) {
    }

    public record UpdateRequest(
            @NotBlank String title,
            @NotNull JobType jobType,
            String description,

            @NotNull WorkType workType,
            @NotNull EmploymentType employmentType,
            String employmentTypeNote,
            @NotBlank String workDays,
            @NotNull LocalTime workStartTime,
            @NotNull LocalTime workEndTime,
            @NotNull PayType payType,
            @NotNull @Positive Integer payAmount,
            @NotNull @Positive Integer recruitCount,
            @NotNull @FutureOrPresent LocalDate deadline,

            @NotBlank String sido,
            @NotBlank String sigungu,
            String addressDetail,

            @NotNull CareGrade careGrade,
            @NotNull ElderGender elderGender,
            String elderAgeRange,
            @NotNull MobilityStatus mobilityStatus,
            @NotNull MealStatus mealStatus,
            @NotNull CognitiveStatus cognitiveStatus,

            List<String> duties,
            List<String> requiredDocuments
    ) {
        public JobPosting.UpdateForm toUpdateForm() {
            return new JobPosting.UpdateForm(
                    title, jobType, description,
                    workType, employmentType, employmentTypeNote,
                    workDays, workStartTime, workEndTime,
                    payType, payAmount, recruitCount, deadline,
                    sido, sigungu, addressDetail,
                    careGrade, elderGender, elderAgeRange,
                    mobilityStatus, mealStatus, cognitiveStatus,
                    duties, requiredDocuments);
        }
    }

    // =====================================================================
    // 응답
    // =====================================================================

    /** 상세 응답. */
    public record DetailResponse(
            Long id,
            String title,
            JobType jobType,
            String description,

            WorkType workType,
            EmploymentType employmentType,
            String employmentTypeNote,
            String workDays,
            LocalTime workStartTime,
            LocalTime workEndTime,
            PayType payType,
            Integer payAmount,
            Integer recruitCount,
            LocalDate deadline,
            Long dDay,

            String sido,
            String sigungu,
            String addressDetail,

            CareGrade careGrade,
            ElderGender elderGender,
            String elderAgeRange,
            MobilityStatus mobilityStatus,
            MealStatus mealStatus,
            CognitiveStatus cognitiveStatus,

            List<String> duties,
            List<String> requiredDocuments,

            JobPostingStatus status,
            ExposureType exposureType,
            boolean isNew,
            boolean isClosingSoon,
            boolean isRecommended,

            long viewCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,

            // 시설 정보 (연락처는 무료 공개). 시설유형/담당자/주소는 FacilityProfile 확장 후 채운다(TODO).
            Long facilityMemberId,
            String facilityName,
            String facilityPhone,

            /** 매칭 스코어(0~100). JobSeekerProfile 확장 전까지 항상 null (TODO). */
            Integer matchingScore
    ) {
        public static DetailResponse from(JobPosting jp, Integer matchingScore) {
            FacilityProfile fp = jp.getFacilityProfile();
            Member m = fp.getMember();
            Long dDay = jp.getDeadline() == null ? null
                    : ChronoUnit.DAYS.between(LocalDate.now(), jp.getDeadline());
            return new DetailResponse(
                    jp.getId(), jp.getTitle(), jp.getJobType(), jp.getDescription(),
                    jp.getWorkType(), jp.getEmploymentType(), jp.getEmploymentTypeNote(),
                    jp.getWorkDays(), jp.getWorkStartTime(), jp.getWorkEndTime(),
                    jp.getPayType(), jp.getPayAmount(), jp.getRecruitCount(), jp.getDeadline(), dDay,
                    jp.getSido(), jp.getSigungu(), jp.getAddressDetail(),
                    jp.getCareGrade(), jp.getElderGender(), jp.getElderAgeRange(),
                    jp.getMobilityStatus(), jp.getMealStatus(), jp.getCognitiveStatus(),
                    jp.getDuties(), jp.getRequiredDocuments(),
                    jp.getStatus(), jp.getExposureType(),
                    calcNew(jp), calcClosingSoon(jp, dDay), calcRecommended(matchingScore),
                    jp.getViewCount(), jp.getCreatedAt(), jp.getUpdatedAt(),
                    m.getId(), fp.getFacilityName(), m.getPhone(),
                    matchingScore);
        }
    }

    /** 목록 카드용 경량 응답. */
    public record SummaryResponse(
            Long id,
            String title,
            JobType jobType,
            String sido,
            String sigungu,
            String workDays,
            LocalTime workStartTime,
            LocalTime workEndTime,
            PayType payType,
            Integer payAmount,
            CareGrade careGrade,
            ElderGender elderGender,
            MobilityStatus mobilityStatus,
            List<String> duties,
            LocalDate deadline,
            Long dDay,
            long viewCount,
            JobPostingStatus status,
            ExposureType exposureType,
            boolean isNew,
            boolean isClosingSoon,
            boolean isRecommended,
            String facilityName,
            Integer matchingScore
    ) {
        public static SummaryResponse from(JobPosting jp) {
            Long dDay = jp.getDeadline() == null ? null
                    : ChronoUnit.DAYS.between(LocalDate.now(), jp.getDeadline());
            return new SummaryResponse(
                    jp.getId(), jp.getTitle(), jp.getJobType(),
                    jp.getSido(), jp.getSigungu(),
                    jp.getWorkDays(), jp.getWorkStartTime(), jp.getWorkEndTime(),
                    jp.getPayType(), jp.getPayAmount(),
                    jp.getCareGrade(), jp.getElderGender(), jp.getMobilityStatus(),
                    jp.getDuties(), jp.getDeadline(), dDay, jp.getViewCount(),
                    jp.getStatus(), jp.getExposureType(),
                    calcNew(jp), calcClosingSoon(jp, dDay), false,
                    jp.getFacilityProfile().getFacilityName(), null);
        }
    }

    /** Page<T> 직렬화 대신 쓰는 커스텀 페이지 응답. */
    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
        public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
            return new PageResponse<>(
                    page.getContent().stream().map(mapper).toList(),
                    page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
        }
    }

    // =====================================================================
    // 계산 helper
    // =====================================================================

    private static boolean calcNew(JobPosting jp) {
        return jp.getCreatedAt() != null
                && jp.getCreatedAt().isAfter(LocalDateTime.now().minusDays(NEW_DAYS));
    }

    private static boolean calcClosingSoon(JobPosting jp, Long dDay) {
        return dDay != null && dDay >= 0 && dDay <= CLOSING_SOON_DAYS
                && jp.getStatus() == JobPostingStatus.OPEN;
    }

    private static boolean calcRecommended(Integer matchingScore) {
        return matchingScore != null && matchingScore >= 70;
    }
}
