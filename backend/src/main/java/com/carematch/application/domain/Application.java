package com.carematch.application.domain;

import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.member.domain.JobSeekerProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 구직자가 구인공고에 지원한 내역. (공고, 지원자) 조합은 유일 —
 * 취소(CANCELED) 후 재지원 시 기존 행을 되살린다.
 *
 * 상태 전이: APPLIED → (지원자) CANCELED / (시설) ACCEPTED · REJECTED.
 * CANCELED → (지원자 재지원) APPLIED. 그 외 전이는 {@link ErrorCode#APPLICATION_INVALID_STATE}.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "application", uniqueConstraints = {
        @UniqueConstraint(name = "uk_application_posting_seeker",
                columnNames = {"job_posting_id", "job_seeker_profile_id"})
}, indexes = {
        @Index(name = "idx_application_posting_status", columnList = "job_posting_id, status"),
        @Index(name = "idx_application_seeker_status", columnList = "job_seeker_profile_id, status")
})
public class Application extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_seeker_profile_id", nullable = false)
    private JobSeekerProfile jobSeekerProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ApplicationStatus status;

    /** 지원자가 남기는 짧은 메시지 (선택). */
    @Column(name = "message", length = 500)
    private String message;

    /** 시설이 수락/반려한 시각. */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Builder
    private Application(JobPosting jobPosting, JobSeekerProfile jobSeekerProfile, String message) {
        this.jobPosting = jobPosting;
        this.jobSeekerProfile = jobSeekerProfile;
        this.message = message;
        this.status = ApplicationStatus.APPLIED;
    }

    /** 취소된 지원을 다시 APPLIED 로. 그 외 상태면 이미 지원한 것으로 간주. */
    public void reapply(String message) {
        if (status != ApplicationStatus.CANCELED) {
            throw new BusinessException(ErrorCode.APPLICATION_ALREADY_EXISTS, "status=" + status);
        }
        this.status = ApplicationStatus.APPLIED;
        this.message = message;
        this.processedAt = null;
    }

    public void cancel() {
        requireApplied();
        this.status = ApplicationStatus.CANCELED;
    }

    public void accept() {
        requireApplied();
        this.status = ApplicationStatus.ACCEPTED;
        this.processedAt = LocalDateTime.now();
    }

    public void reject() {
        requireApplied();
        this.status = ApplicationStatus.REJECTED;
        this.processedAt = LocalDateTime.now();
    }

    private void requireApplied() {
        if (status != ApplicationStatus.APPLIED) {
            throw new BusinessException(ErrorCode.APPLICATION_INVALID_STATE, "status=" + status);
        }
    }

    public boolean isAppliedBy(Long memberId) {
        return jobSeekerProfile.getMember().getId().equals(memberId);
    }

    public boolean isForFacility(Long facilityMemberId) {
        return jobPosting.getFacilityProfile().getMember().getId().equals(facilityMemberId);
    }
}
