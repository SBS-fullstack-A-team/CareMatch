package com.carematch.entity;

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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "job_seeker")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JobSeeker extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String name;

    /** 희망 근무지역 — 공개 정보 (검색/매칭에 사용). */
    @Column(nullable = false)
    private String region;

    /** 실거주지 — 연락처처럼 포인트로 열람해야 하는 비공개 정보. */
    @Column(name = "residence_region")
    private String residenceRegion;

    @Column(name = "desired_job_type")
    private String desiredJobType;

    private String career;

    @Column(name = "desired_pay")
    private Integer desiredPay;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false)
    private EmploymentStatus employmentStatus;

    @Builder
    public JobSeeker(Member member, String name, String region, String residenceRegion,
                      String desiredJobType, String career, Integer desiredPay) {
        this.member = member;
        this.name = name;
        this.region = region;
        this.residenceRegion = residenceRegion;
        this.desiredJobType = desiredJobType;
        this.career = career;
        this.desiredPay = desiredPay;
        this.employmentStatus = EmploymentStatus.SEEKING;
    }

    public void update(String name, String region, String desiredJobType, String career, Integer desiredPay) {
        this.name = name;
        this.region = region;
        this.desiredJobType = desiredJobType;
        this.career = career;
        this.desiredPay = desiredPay;
    }

    /** 지원 수락(Application ACCEPTED) 시 자동으로 취업완료 처리된다. */
    public void markAsEmployed() {
        this.employmentStatus = EmploymentStatus.EMPLOYED;
    }

    public boolean isOwnedBy(Long memberId) {
        return this.member.getId().equals(memberId);
    }
}
