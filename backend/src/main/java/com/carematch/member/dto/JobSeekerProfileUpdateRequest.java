package com.carematch.member.dto;

import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.CareTask;
import com.carematch.member.domain.EducationLevel;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.Gender;
import com.carematch.member.domain.JobSeekerProfile;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * 내 구직자 프로필 수정 요청 (PUT /api/jobseekers/me).
 *
 * 거주지/자기소개/취업상태는 항상 요청 값으로 덮어쓴다(부분수정 아님).
 * 인적사항·표시용 필드·희망 근무조건은 전부 선택 — 안 보내면 "없음"으로 저장된다.
 */
public record JobSeekerProfileUpdateRequest(
        @NotNull
        EmploymentStatus employmentStatus,

        @Size(max = 200)
        String residence,

        @Size(max = 1000)
        String introduction,

        // --- 인적사항 / 표시용 ---
        Gender gender,
        Integer birthYear,
        @Size(max = 500) @URL(regexp = "^https?://.*") String photoUrl,
        @PositiveOrZero Integer careerYears,
        EducationLevel education,
        @Size(max = 100) String headline,
        List<CareTask> availableTasks,

        // --- 희망 근무조건 ---
        JobType desiredJobType,
        WorkType desiredWorkType,
        WorkSchedule desiredWorkSchedule,
        @Size(max = 30) String desiredSido,
        @Size(max = 30) String desiredSigungu,
        PayType desiredPayType,
        @Positive Integer desiredMinPay,
        List<EmploymentType> desiredEmploymentTypes,
        @Size(max = 100) String desiredWorkDays,
        LocalTime desiredWorkStartTime,
        LocalTime desiredWorkEndTime
) {
    public JobSeekerProfile.DesiredConditions toDesiredConditions() {
        return new JobSeekerProfile.DesiredConditions(
                desiredJobType, desiredWorkType, desiredWorkSchedule,
                desiredSido, desiredSigungu, desiredPayType, desiredMinPay);
    }

    public JobSeekerProfile.ProfileDetails toProfileDetails() {
        return new JobSeekerProfile.ProfileDetails(
                gender, birthYear, photoUrl, careerYears, education, headline,
                toSet(availableTasks, CareTask.class),
                toSet(desiredEmploymentTypes, EmploymentType.class),
                desiredWorkDays, desiredWorkStartTime, desiredWorkEndTime);
    }

    private static <E extends Enum<E>> Set<E> toSet(List<E> list, Class<E> type) {
        return (list == null || list.isEmpty()) ? EnumSet.noneOf(type) : EnumSet.copyOf(list);
    }
}
