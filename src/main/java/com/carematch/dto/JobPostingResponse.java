package com.carematch.dto;

import com.carematch.entity.CareGrade;
import com.carematch.entity.CognitiveStatus;
import com.carematch.entity.EmploymentType;
import com.carematch.entity.ExposureType;
import com.carematch.entity.FacilityType;
import com.carematch.entity.Gender;
import com.carematch.entity.JobPosting;
import com.carematch.entity.JobPostingStatus;
import com.carematch.entity.JobType;
import com.carematch.entity.MealStatus;
import com.carematch.entity.Member;
import com.carematch.entity.MobilityStatus;
import com.carematch.entity.PayType;
import com.carematch.entity.WorkType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** 구인공고 상세/단건 응답. 목록은 별도의 경량 DTO(2단계)를 사용한다. */
public record JobPostingResponse(
        Long id,
        Long memberId,
        String title,
        JobType jobType,
        String description,

        // 근무조건
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

        // 근무지
        String sido,
        String sigungu,
        String addressDetail,

        // 어르신 정보
        CareGrade careGrade,
        Gender elderGender,
        String elderAgeRange,
        MobilityStatus mobilityStatus,
        MealStatus mealStatus,
        CognitiveStatus cognitiveStatus,

        // 다중값
        List<String> duties,
        List<String> requiredDocuments,

        // 상태 / 노출 / 뱃지
        JobPostingStatus status,
        ExposureType exposureType,
        boolean isNew,
        boolean isClosingSoon,
        boolean isRecommended,

        long viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // 시설 정보 (연락처는 무료 공개 정책)
        String facilityName,
        FacilityType facilityType,
        String managerName,
        String managerPosition,
        String facilityAddress,
        String employerPhone,

        // 로그인한 구직자 조건과 비교한 매칭 스코어(0~100). 비로그인/구인자는 null.
        Integer matchingScore
) {
    private static final int RECOMMEND_THRESHOLD = 70;
    private static final int NEW_DAYS = 3;
    private static final int CLOSING_SOON_DAYS = 7;

    public static JobPostingResponse from(JobPosting jp) {
        return from(jp, null);
    }

    public static JobPostingResponse from(JobPosting jp, Integer matchingScore) {
        Member m = jp.getMember();

        Long dDay = jp.getDeadline() == null
                ? null
                : ChronoUnit.DAYS.between(LocalDate.now(), jp.getDeadline());

        boolean isNew = jp.getCreatedAt() != null
                && jp.getCreatedAt().isAfter(LocalDateTime.now().minusDays(NEW_DAYS));
        boolean isClosingSoon = dDay != null && dDay >= 0 && dDay <= CLOSING_SOON_DAYS
                && jp.getStatus() == JobPostingStatus.OPEN;
        boolean isRecommended = matchingScore != null && matchingScore >= RECOMMEND_THRESHOLD;

        return new JobPostingResponse(
                jp.getId(),
                m.getId(),
                jp.getTitle(),
                jp.getJobType(),
                jp.getDescription(),
                jp.getWorkType(),
                jp.getEmploymentType(),
                jp.getEmploymentTypeNote(),
                jp.getWorkDays(),
                jp.getWorkStartTime(),
                jp.getWorkEndTime(),
                jp.getPayType(),
                jp.getPayAmount(),
                jp.getRecruitCount(),
                jp.getDeadline(),
                dDay,
                jp.getSido(),
                jp.getSigungu(),
                jp.getAddressDetail(),
                jp.getCareGrade(),
                jp.getElderGender(),
                jp.getElderAgeRange(),
                jp.getMobilityStatus(),
                jp.getMealStatus(),
                jp.getCognitiveStatus(),
                jp.getDuties(),
                jp.getRequiredDocuments(),
                jp.getStatus(),
                jp.getExposureType(),
                isNew,
                isClosingSoon,
                isRecommended,
                jp.getViewCount(),
                jp.getCreatedAt(),
                jp.getUpdatedAt(),
                m.getFacilityName(),
                m.getFacilityType(),
                m.getManagerName(),
                m.getManagerPosition(),
                m.getFacilityAddress(),
                m.getPhone(),
                matchingScore
        );
    }
}
