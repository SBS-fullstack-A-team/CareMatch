package com.carematch.dto;

import com.carematch.entity.Application;
import com.carematch.entity.ApplicationStatus;

import java.time.LocalDateTime;

public record ApplicationResponse(
        Long id,
        Long jobPostingId,
        String jobPostingTitle,
        Long applicantId,
        String applicantName,
        String message,
        ApplicationStatus status,
        LocalDateTime appliedAt
) {
    public static ApplicationResponse from(Application application) {
        return new ApplicationResponse(
                application.getId(),
                application.getJobPosting().getId(),
                application.getJobPosting().getTitle(),
                application.getApplicant().getId(),
                application.getApplicant().getName(),
                application.getMessage(),
                application.getStatus(),
                application.getCreatedAt()
        );
    }
}
