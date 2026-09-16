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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 경력 인증 신청. 자격증과 달리 파일 증빙 없이 텍스트 입력(근무기관/기간/설명)만 받고
 * 관리자가 내용을 보고 승인/반려한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "career_verification")
public class CareerVerification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jobseeker_profile_id", nullable = false)
    private JobSeekerProfile jobSeekerProfile;

    @Column(name = "organization_name", nullable = false, length = 100)
    private String organizationName;

    /** 직무/역할. "position"은 Postgres 예약어라 컬럼명 충돌을 피해 role_title 로 저장. */
    @Column(name = "role_title", length = 100)
    private String roleTitle;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** null 이면 재직중. */
    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CareerVerificationStatus status;

    @Column(name = "reject_reason", length = 300)
    private String rejectReason;

    /** 증빙 파일 스토리지 key. POST /api/files/upload-url (purpose=CAREER_PROOF) 로 올린 값. */
    @Column(name = "file_key", length = 500)
    private String fileKey;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Builder
    private CareerVerification(JobSeekerProfile jobSeekerProfile, String organizationName, String roleTitle,
                               LocalDate startDate, LocalDate endDate, String description, String fileKey) {
        this.jobSeekerProfile = jobSeekerProfile;
        this.organizationName = organizationName;
        this.roleTitle = roleTitle;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
        this.fileKey = fileKey;
        this.status = CareerVerificationStatus.PENDING;
    }

    public void assignProfile(JobSeekerProfile profile) {
        this.jobSeekerProfile = profile;
    }

    public void approve(LocalDateTime when) {
        this.status = CareerVerificationStatus.APPROVED;
        this.rejectReason = null;
        this.reviewedAt = when;
    }

    public void reject(String reason, LocalDateTime when) {
        this.status = CareerVerificationStatus.REJECTED;
        this.rejectReason = reason;
        this.reviewedAt = when;
    }
}
