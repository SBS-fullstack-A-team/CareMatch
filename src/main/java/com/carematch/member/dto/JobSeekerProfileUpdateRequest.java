package com.carematch.member.dto;

import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * 내 구직자 프로필 수정 요청 (PUT /api/jobseekers/me).
 *
 * 거주지/자기소개/취업상태는 항상 요청 값으로 덮어쓴다(부분수정 아님).
 * 희망 근무조건은 전부 선택 — null 이면 "조건 없음"으로 저장된다.
 */
public record JobSeekerProfileUpdateRequest(
        @NotNull
        EmploymentStatus employmentStatus,

        @Size(max = 200)
        String residence,

        @Size(max = 1000)
        String introduction,

        // --- 희망 근무조건 (매칭 스코어 계산용) ---
        JobType desiredJobType,
        WorkType desiredWorkType,
        @Size(max = 30) String desiredSido,
        @Size(max = 30) String desiredSigungu,
        PayType desiredPayType,
        @Positive Integer desiredMinPay
) {
    public JobSeekerProfile.DesiredConditions toDesiredConditions() {
        return new JobSeekerProfile.DesiredConditions(
                desiredJobType, desiredWorkType, desiredSido, desiredSigungu, desiredPayType, desiredMinPay);
    }
}
