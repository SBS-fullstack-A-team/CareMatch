package com.carematch.dto;

import com.carematch.entity.CareGrade;
import com.carematch.entity.CognitiveStatus;
import com.carematch.entity.EmploymentType;
import com.carematch.entity.ExposureType;
import com.carematch.entity.Gender;
import com.carematch.entity.JobType;
import com.carematch.entity.MealStatus;
import com.carematch.entity.MobilityStatus;
import com.carematch.entity.PayType;
import com.carematch.entity.WorkType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * 구인공고 등록 요청. enum 필드는 Jackson 이 문자열("CAREGIVER" 등)을 그대로 매핑하고,
 * 잘못된 값이면 GlobalExceptionHandler 가 400 으로 처리한다.
 */
public record JobPostingCreateRequest(
        @NotBlank String title,
        @NotNull JobType jobType,
        String description,

        // 근무조건
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

        // 근무지
        @NotBlank String sido,
        @NotBlank String sigungu,
        String addressDetail,

        // 어르신 정보
        @NotNull CareGrade careGrade,
        @NotNull Gender elderGender,
        String elderAgeRange,
        @NotNull MobilityStatus mobilityStatus,
        @NotNull MealStatus mealStatus,
        @NotNull CognitiveStatus cognitiveStatus,

        // 다중값 (표시용)
        List<String> duties,
        List<String> requiredDocuments,

        // 노출옵션 (null 이면 NORMAL)
        ExposureType exposureType
) {
}
