package com.carematch.application.dto;

import com.carematch.application.domain.Application;
import com.carematch.application.domain.ApplicationStatus;
import com.carematch.jobposting.domain.JobPosting;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 구직 지원 요청/응답 DTO.
 */
public final class ApplicationDtos {

    private ApplicationDtos() {
    }

    public record ApplyRequest(
            @Size(max = 500) String message
    ) {
    }

    public record CreatedResponse(Long applicationId) {
    }

    /** 시설의 지원자 수락/반려. status 는 ACCEPTED 또는 REJECTED 만 허용. */
    public record DecisionRequest(
            @NotNull ApplicationStatus status
    ) {
    }

    /** 시설이 보는 지원자 카드. */
    public record ApplicantResponse(
            Long applicationId,
            ApplicationStatus status,
            LocalDateTime appliedAt,
            LocalDateTime processedAt,
            String message,

            Long profileId,
            Long memberId,
            String applicantName,
            String employmentStatus,
            String desiredJobType,
            List<String> certificateNames,
            /** 이 공고 ↔ 지원자 희망조건 매칭 점수. 지원자 희망조건 미설정이면 null. */
            Integer matchingScore
    ) {
        public static ApplicantResponse from(Application a, List<String> certificateNames, Integer matchingScore) {
            var seeker = a.getJobSeekerProfile();
            return new ApplicantResponse(
                    a.getId(), a.getStatus(), a.getCreatedAt(), a.getProcessedAt(), a.getMessage(),
                    seeker.getId(), seeker.getMember().getId(), seeker.getMember().getName(),
                    seeker.getEmploymentStatus().name(),
                    seeker.getDesiredJobType() == null ? null : seeker.getDesiredJobType().name(),
                    certificateNames, matchingScore);
        }
    }

    /** 지원자가 보는 내 지원 내역. */
    public record MyApplicationResponse(
            Long applicationId,
            ApplicationStatus status,
            LocalDateTime appliedAt,
            LocalDateTime processedAt,
            String message,

            Long jobPostingId,
            String title,
            String facilityName,
            String sido,
            String sigungu,
            LocalDate deadline,
            Long dDay,
            String postingStatus
    ) {
        public static MyApplicationResponse from(Application a) {
            JobPosting jp = a.getJobPosting();
            Long dDay = jp.getDeadline() == null ? null
                    : ChronoUnit.DAYS.between(LocalDate.now(), jp.getDeadline());
            return new MyApplicationResponse(
                    a.getId(), a.getStatus(), a.getCreatedAt(), a.getProcessedAt(), a.getMessage(),
                    jp.getId(), jp.getTitle(), jp.getFacilityProfile().getFacilityName(),
                    jp.getSido(), jp.getSigungu(), jp.getDeadline(), dDay, jp.getStatus().name());
        }
    }
}
