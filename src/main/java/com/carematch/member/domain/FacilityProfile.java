package com.carematch.member.domain;

import com.carematch.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 시설(기업) 전용 확장 프로필. Member 와 1:1.
 * 가입 직후 approvalStatus = PENDING. 관리자 승인 전까지 핵심 기능 접근 차단.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "facility_profile", uniqueConstraints = {
        @UniqueConstraint(name = "uk_facility_member", columnNames = "member_id"),
        @UniqueConstraint(name = "uk_facility_biz_no", columnNames = "business_registration_number")
})
public class FacilityProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "facility_name", nullable = false, length = 100)
    private String facilityName;

    @Column(name = "business_registration_number", nullable = false, length = 20)
    private String businessRegistrationNumber;

    /**
     * 사업자등록증 파일의 스토리지 키(공개 URL 아님).
     * 실제 열람 시 FileStorageService 가 서명 URL 을 발급.
     */
    @Column(name = "business_license_file_key", length = 300)
    private String businessLicenseFileKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private FacilityApprovalStatus approvalStatus;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "reject_reason", length = 300)
    private String rejectReason;

    @Builder
    private FacilityProfile(Member member, String facilityName, String businessRegistrationNumber,
                            String businessLicenseFileKey) {
        this.member = member;
        this.facilityName = facilityName;
        this.businessRegistrationNumber = businessRegistrationNumber;
        this.businessLicenseFileKey = businessLicenseFileKey;
        this.approvalStatus = FacilityApprovalStatus.PENDING;
    }

    public boolean isApproved() {
        return approvalStatus == FacilityApprovalStatus.APPROVED;
    }

    public void approve(LocalDateTime when) {
        this.approvalStatus = FacilityApprovalStatus.APPROVED;
        this.approvedAt = when;
        this.rejectReason = null;
    }

    public void reject(String reason, LocalDateTime when) {
        this.approvalStatus = FacilityApprovalStatus.REJECTED;
        this.approvedAt = when;
        this.rejectReason = reason;
    }

    public void updateBusinessLicenseKey(String fileKey) {
        this.businessLicenseFileKey = fileKey;
    }
}
