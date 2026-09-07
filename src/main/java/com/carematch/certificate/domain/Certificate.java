package com.carematch.certificate.domain;

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

/**
 * 요양보호사 자격증. 파일 자체는 스토리지에 있고 여기엔 "키"만 저장한다.
 * 공개 URL 을 저장하지 않는다 — 열람 시 서명(만료) URL 을 발급.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "certificate")
public class Certificate extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jobseeker_profile_id", nullable = false)
    private JobSeekerProfile jobSeekerProfile;

    @Column(name = "certificate_name", nullable = false, length = 100)
    private String certificateName;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    /** 스토리지 오브젝트 키 (예: "certificates/2026/09/uuid.jpg"). 공개 URL 아님. */
    @Column(name = "file_key", nullable = false, length = 300)
    private String fileKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CertificateStatus status;

    // --- 업로드 검증 콜백으로 채워지는 값(스토리지 확정 후 구현) ---
    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "reject_reason", length = 300)
    private String rejectReason;

    @Builder
    private Certificate(JobSeekerProfile jobSeekerProfile, String certificateName,
                        String certificateNumber, String fileKey) {
        this.jobSeekerProfile = jobSeekerProfile;
        this.certificateName = certificateName;
        this.certificateNumber = certificateNumber;
        this.fileKey = fileKey;
        this.status = CertificateStatus.PENDING;
    }

    public void assignProfile(JobSeekerProfile profile) {
        this.jobSeekerProfile = profile;
    }

    public void markVerified(long fileSize, String contentType) {
        this.status = CertificateStatus.VERIFIED;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.rejectReason = null;
    }

    public void markRejected(String reason) {
        this.status = CertificateStatus.REJECTED;
        this.rejectReason = reason;
    }
}
