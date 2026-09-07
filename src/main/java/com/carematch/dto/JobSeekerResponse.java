package com.carematch.dto;

import com.carematch.entity.EmploymentStatus;
import com.carematch.entity.JobSeeker;

public record JobSeekerResponse(
        Long id,
        Long memberId,
        String name,
        String region,
        String desiredJobType,
        String career,
        Integer desiredPay,
        EmploymentStatus employmentStatus,
        // 로그인한 구인자 본인 공고들과 비교한 최고 매칭 스코어. 비로그인/구직자는 null.
        Integer matchingScore
) {
    public static JobSeekerResponse from(JobSeeker jobSeeker) {
        return from(jobSeeker, null);
    }

    public static JobSeekerResponse from(JobSeeker jobSeeker, Integer matchingScore) {
        return new JobSeekerResponse(
                jobSeeker.getId(),
                jobSeeker.getMember().getId(),
                jobSeeker.getName(),
                jobSeeker.getRegion(),
                jobSeeker.getDesiredJobType(),
                jobSeeker.getCareer(),
                jobSeeker.getDesiredPay(),
                jobSeeker.getEmploymentStatus(),
                matchingScore
        );
    }
}
