package com.carematch.entity;

import com.carematch.entity.JobPosting;
import com.carematch.entity.Member;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "application",
        uniqueConstraints = @UniqueConstraint(columnNames = {"job_posting_id", "applicant_id"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Application extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Member applicant;

    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Builder
    public Application(JobPosting jobPosting, Member applicant, String message) {
        this.jobPosting = jobPosting;
        this.applicant = applicant;
        this.message = message;
        this.status = ApplicationStatus.PENDING;
    }

    public void accept() {
        this.status = ApplicationStatus.ACCEPTED;
    }

    public void reject() {
        this.status = ApplicationStatus.REJECTED;
    }

    public void cancel() {
        this.status = ApplicationStatus.CANCELED;
    }

    public boolean isApplicant(Long memberId) {
        return this.applicant.getId().equals(memberId);
    }

    public boolean isPostingOwner(Long memberId) {
        return this.jobPosting.getMember().getId().equals(memberId);
    }
}
