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
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.Member;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;
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
     * 급여 형태(payTypes)는 다중 선택(OR). 급여 범위(payMin/payMax)는 payTypes 를 함께
     * 지정하지 않으면 시급·월급이 섞여 비교되니 프론트에서 함께 보내는 것을 권장.
     */
    public record SearchCondition(
            String sido,
            String sigungu,
            List<JobType> jobTypes,
            List<WorkType> workTypes,
            /** 근무 시간대(주간/오전/오후/야간/교대) 다중(OR). */
            List<WorkSchedule> workSchedules,
            List<EmploymentType> employmentTypes,
            List<CareGrade> careGrades,
            List<MobilityStatus> mobilityStatuses,
            List<PayType> payTypes,
            Integer payMin,
            Integer payMax,
            /** RECOMMENDED(기본) / LATEST / DEADLINE / PAY_DESC / PAY_ASC / VIEWS */
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
            /** 우대사항 자유 기술 (예: "면접 후 즉시 근무 우대"). 선택. */
            @Size(max = 2000) String preferredNote,
            /** 대표 이미지 URL. 프론트가 업로드(POST /api/files/upload-url, purpose=JOB_POSTING_IMAGE) 후 최종 URL 전달. */
            @Size(max = 500) @URL(regexp = "^https?://.*") String thumbnailUrl,

            @NotNull WorkType workType,
            /** 근무 시간대. 입주형(LIVE_IN)이면 생략 가능, 그 외에는 넣는다. */
            WorkSchedule workSchedule,
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
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,

            @NotNull CareGrade careGrade,
            @NotNull ElderGender elderGender,
            String elderAgeRange,
            @NotNull MobilityStatus mobilityStatus,
            @NotNull MealStatus mealStatus,
            @NotNull CognitiveStatus cognitiveStatus,
            /** 어르신 특이사항 (낙상 주의, 알레르기, 과거 병력 등). 선택. */
            @Size(max = 2000) String elderNote,

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
            @Size(max = 2000) String preferredNote,
            @Size(max = 500) @URL(regexp = "^https?://.*") String thumbnailUrl,

            @NotNull WorkType workType,
            /** 근무 시간대. 입주형(LIVE_IN)이면 생략 가능, 그 외에는 넣는다. */
            WorkSchedule workSchedule,
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
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,

            @NotNull CareGrade careGrade,
            @NotNull ElderGender elderGender,
            String elderAgeRange,
            @NotNull MobilityStatus mobilityStatus,
            @NotNull MealStatus mealStatus,
            @NotNull CognitiveStatus cognitiveStatus,
            @Size(max = 2000) String elderNote,

            List<String> duties,
            List<String> requiredDocuments
    ) {
        public JobPosting.UpdateForm toUpdateForm() {
            return new JobPosting.UpdateForm(
                    title, jobType, description, preferredNote, thumbnailUrl,
                    workType, workSchedule, employmentType, employmentTypeNote,
                    workDays, workStartTime, workEndTime,
                    payType, payAmount, recruitCount, deadline,
                    sido, sigungu, addressDetail, latitude, longitude,
                    careGrade, elderGender, elderAgeRange,
                    mobilityStatus, mealStatus, cognitiveStatus,
                    elderNote,
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
            String preferredNote,
            String thumbnailUrl,

            WorkType workType,
            WorkSchedule workSchedule,
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
            Double latitude,
            Double longitude,

            CareGrade careGrade,
            ElderGender elderGender,
            String elderAgeRange,
            MobilityStatus mobilityStatus,
            MealStatus mealStatus,
            CognitiveStatus cognitiveStatus,
            String elderNote,

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

            /** 매칭 스코어(0~100). 로그인한 구직자가 희망조건을 설정한 경우만 채워지고, 그 외에는 null. */
            Integer matchingScore,

            /** 매칭 사유 문구 (예: "희망하는 근무지와 일치해요"). 일치한 항목만. 채점 불가면 빈 리스트. */
            List<String> matchingReasons,

            /** 로그인 회원의 찜 여부. 비로그인이면 null. */
            Boolean scrapped
    ) {
        public static DetailResponse from(JobPosting jp, Integer matchingScore) {
            return from(jp, matchingScore, null, null);
        }

        public static DetailResponse from(JobPosting jp, Integer matchingScore, Boolean scrapped) {
            return from(jp, matchingScore, null, scrapped);
        }

        public static DetailResponse from(JobPosting jp, Integer matchingScore,
                                          List<String> matchingReasons, Boolean scrapped) {
            FacilityProfile fp = jp.getFacilityProfile();
            Member m = fp.getMember();
            Long dDay = jp.getDeadline() == null ? null
                    : ChronoUnit.DAYS.between(LocalDate.now(), jp.getDeadline());
            return new DetailResponse(
                    jp.getId(), jp.getTitle(), jp.getJobType(), jp.getDescription(),
                    jp.getPreferredNote(), jp.getThumbnailUrl(),
                    jp.getWorkType(), jp.getWorkSchedule(), jp.getEmploymentType(), jp.getEmploymentTypeNote(),
                    jp.getWorkDays(), jp.getWorkStartTime(), jp.getWorkEndTime(),
                    jp.getPayType(), jp.getPayAmount(), jp.getRecruitCount(), jp.getDeadline(), dDay,
                    jp.getSido(), jp.getSigungu(), jp.getAddressDetail(), jp.getLatitude(), jp.getLongitude(),
                    jp.getCareGrade(), jp.getElderGender(), jp.getElderAgeRange(),
                    jp.getMobilityStatus(), jp.getMealStatus(), jp.getCognitiveStatus(), jp.getElderNote(),
                    jp.getDuties(), jp.getRequiredDocuments(),
                    jp.getStatus(), jp.getExposureType(),
                    calcNew(jp), calcClosingSoon(jp, dDay), calcRecommended(matchingScore),
                    jp.getViewCount(), jp.getCreatedAt(), jp.getUpdatedAt(),
                    m.getId(), fp.getFacilityName(), m.getPhone(),
                    matchingScore, matchingReasons == null ? List.of() : matchingReasons, scrapped);
        }
    }

    /** 목록 카드용 경량 응답. */
    public record SummaryResponse(
            Long id,
            String title,
            JobType jobType,
            String thumbnailUrl,
            String sido,
            String sigungu,
            WorkSchedule workSchedule,
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
            Integer matchingScore,
            /** 로그인 회원의 찜 여부. 비로그인이면 null. */
            Boolean scrapped
    ) {
        public static SummaryResponse from(JobPosting jp) {
            return from(jp, null, null);
        }

        public static SummaryResponse from(JobPosting jp, Boolean scrapped) {
            return from(jp, scrapped, null);
        }

        public static SummaryResponse from(JobPosting jp, Boolean scrapped, Integer matchingScore) {
            Long dDay = jp.getDeadline() == null ? null
                    : ChronoUnit.DAYS.between(LocalDate.now(), jp.getDeadline());
            return new SummaryResponse(
                    jp.getId(), jp.getTitle(), jp.getJobType(), jp.getThumbnailUrl(),
                    jp.getSido(), jp.getSigungu(), jp.getWorkSchedule(),
                    jp.getWorkDays(), jp.getWorkStartTime(), jp.getWorkEndTime(),
                    jp.getPayType(), jp.getPayAmount(),
                    jp.getCareGrade(), jp.getElderGender(), jp.getMobilityStatus(),
                    jp.getDuties(), jp.getDeadline(), dDay, jp.getViewCount(),
                    jp.getStatus(), jp.getExposureType(),
                    calcNew(jp), calcClosingSoon(jp, dDay), calcRecommended(matchingScore),
                    jp.getFacilityProfile().getFacilityName(), matchingScore, scrapped);
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

    /** "내 주변 일자리" 결과 — 목록 카드 + 기준 좌표로부터의 거리(km, 소수 1자리). 가까운 순. */
    public record NearbyResult(
            SummaryResponse posting,
            double distanceKm
    ) {
    }

    /**
     * 지도 뷰포트("지도로 보기") 안의 공고 — 마커 좌표 + 목록 카드.
     * {@code SummaryResponse} 에는 위경도가 없어 마커 배치용으로 좌표를 따로 실어 준다.
     */
    public record MapResult(
            SummaryResponse posting,
            double latitude,
            double longitude
    ) {
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
