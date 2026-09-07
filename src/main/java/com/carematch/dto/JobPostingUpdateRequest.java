package com.carematch.dto;

import com.carematch.entity.CareGrade;
import com.carematch.entity.CognitiveStatus;
import com.carematch.entity.EmploymentType;
import com.carematch.entity.Gender;
import com.carematch.entity.JobPosting;
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
 * 구인공고 수정 요청. 노출옵션(exposureType)/상태/조회수는 이 경로로 바꾸지 않는다.
 */
public record JobPostingUpdateRequest(
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
        @NotNull Gender elderGender,
        String elderAgeRange,
        @NotNull MobilityStatus mobilityStatus,
        @NotNull MealStatus mealStatus,
        @NotNull CognitiveStatus cognitiveStatus,

        List<String> duties,
        List<String> requiredDocuments
) {
    /** 엔티티 수정 폼으로 변환. */
    public JobPosting.UpdateForm toUpdateForm() {
        return new JobPosting.UpdateForm(
                title, jobType, description,
                workType, employmentType, employmentTypeNote,
                workDays, workStartTime, workEndTime,
                payType, payAmount, recruitCount, deadline,
                sido, sigungu, addressDetail,
                careGrade, elderGender, elderAgeRange,
                mobilityStatus, mealStatus, cognitiveStatus,
                duties, requiredDocuments
        );
    }
}
