package com.carematch.badge.domain;

import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.member.domain.JobSeekerProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * "인증구직자" 마크 신청. 승인된 자격증·경력인증이 각 1건 이상일 때만 제출 가능
 * ({@link com.carematch.badge.service.BadgeRequestService#request} 에서 검증).
 * 관리자가 최종 승인하면 {@link JobSeekerProfile#grantBadge} 로 마크가 붙는다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "badge_request")
public class BadgeRequest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jobseeker_profile_id", nullable = false)
    private JobSeekerProfile jobSeekerProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BadgeRequestStatus status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "reject_reason", length = 300)
    private String rejectReason;

    @Builder
    private BadgeRequest(JobSeekerProfile jobSeekerProfile) {
        this.jobSeekerProfile = jobSeekerProfile;
        this.status = BadgeRequestStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public void approve(LocalDateTime when) {
        this.status = BadgeRequestStatus.APPROVED;
        this.decidedAt = when;
        this.rejectReason = null;
    }

    public void reject(String reason, LocalDateTime when) {
        this.status = BadgeRequestStatus.REJECTED;
        this.decidedAt = when;
        this.rejectReason = reason;
    }
}
