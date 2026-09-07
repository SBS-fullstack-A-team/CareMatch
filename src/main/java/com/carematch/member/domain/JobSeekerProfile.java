package com.carematch.member.domain;

import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.certificate.domain.Certificate;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 구직자 전용 확장 프로필. Member 와 1:1.
 * 연락처/거주지 원본을 보관하고, 외부 응답 시 DTO 단에서 마스킹한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "jobseeker_profile", uniqueConstraints = {
        @UniqueConstraint(name = "uk_jobseeker_member", columnNames = "member_id")
})
public class JobSeekerProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false, length = 20)
    private EmploymentStatus employmentStatus;

    /** 거주지 원본(전체 주소). 응답 시 구 단위까지만 마스킹. */
    @Column(name = "residence", length = 200)
    private String residence;

    @Column(name = "introduction", length = 1000)
    private String introduction;

    @OneToMany(mappedBy = "jobSeekerProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Certificate> certificates = new ArrayList<>();

    @Builder
    private JobSeekerProfile(Member member, EmploymentStatus employmentStatus, String residence, String introduction) {
        this.member = member;
        this.employmentStatus = employmentStatus == null ? EmploymentStatus.SEEKING : employmentStatus;
        this.residence = residence;
        this.introduction = introduction;
    }

    public boolean isEmployed() {
        return employmentStatus == EmploymentStatus.EMPLOYED;
    }

    public void changeEmploymentStatus(EmploymentStatus status) {
        this.employmentStatus = status;
    }

    public void updateProfile(String residence, String introduction) {
        this.residence = residence;
        this.introduction = introduction;
    }

    public void addCertificate(Certificate certificate) {
        certificates.add(certificate);
        certificate.assignProfile(this);
    }
}
