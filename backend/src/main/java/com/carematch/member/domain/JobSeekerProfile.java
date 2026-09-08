package com.carematch.member.domain;

import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.certificate.domain.Certificate;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

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

    // ===== 인적사항 / 표시용 (전부 선택) =====

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private Gender gender;

    /** 출생연도. 나이는 응답에서 (올해 - birthYear) 로 계산. */
    @Column(name = "birth_year")
    private Integer birthYear;

    /** 프로필 사진 URL. 프론트가 업로드 후 최종 URL 전달. */
    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    /** 관련 경력 연수. 검색 필터(minCareerYears)에 사용. */
    @Column(name = "career_years")
    private Integer careerYears;

    @Enumerated(EnumType.STRING)
    @Column(name = "education", length = 20)
    private EducationLevel education;

    /** 한 줄 소개(성격/각오). 자기소개(introduction)와 별개. */
    @Column(name = "headline", length = 100)
    private String headline;

    /** 수행 가능한 돌봄 업무(다중). 검색 필터. */
    @ElementCollection(targetClass = CareTask.class)
    @CollectionTable(name = "jobseeker_available_task",
            joinColumns = @JoinColumn(name = "jobseeker_profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "task", length = 30, nullable = false)
    private Set<CareTask> availableTasks = EnumSet.noneOf(CareTask.class);

    // ===== 희망 근무조건 (매칭 스코어 계산용, 전부 선택) =====

    /** 희망 직종. */
    @Enumerated(EnumType.STRING)
    @Column(name = "desired_job_type", length = 20)
    private JobType desiredJobType;

    /** 희망 근무형태(출퇴근/입주 등). */
    @Enumerated(EnumType.STRING)
    @Column(name = "desired_work_type", length = 20)
    private WorkType desiredWorkType;

    /** 희망 근무지역 시/도. */
    @Column(name = "desired_sido", length = 30)
    private String desiredSido;

    /** 희망 근무지역 시/군/구. */
    @Column(name = "desired_sigungu", length = 30)
    private String desiredSigungu;

    /** 희망 급여 유형(시급/일급/월급). desiredMinPay 의 단위. */
    @Enumerated(EnumType.STRING)
    @Column(name = "desired_pay_type", length = 20)
    private PayType desiredPayType;

    /** 희망 최소 급여액(desiredPayType 기준). */
    @Column(name = "desired_min_pay")
    private Integer desiredMinPay;

    /** 희망 고용형태(다중). 검색 필터. */
    @ElementCollection(targetClass = EmploymentType.class)
    @CollectionTable(name = "jobseeker_desired_employment_type",
            joinColumns = @JoinColumn(name = "jobseeker_profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", length = 20, nullable = false)
    private Set<EmploymentType> desiredEmploymentTypes = EnumSet.noneOf(EmploymentType.class);

    /** 희망 근무요일 자유표기 (예: "월~금"). 표시용. */
    @Column(name = "desired_work_days", length = 100)
    private String desiredWorkDays;

    @Column(name = "desired_work_start_time")
    private LocalTime desiredWorkStartTime;

    @Column(name = "desired_work_end_time")
    private LocalTime desiredWorkEndTime;

    @OneToMany(mappedBy = "jobSeekerProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Certificate> certificates = new ArrayList<>();

    @Builder
    private JobSeekerProfile(Member member, EmploymentStatus employmentStatus, String residence, String introduction) {
        this.member = member;
        this.employmentStatus = employmentStatus == null ? EmploymentStatus.SEEKING : employmentStatus;
        this.residence = residence;
        this.introduction = introduction;
    }

    /** 희망 근무조건 수정 폼. 지정하지 않은(null) 값은 "조건 없음"으로 그대로 저장한다. */
    public record DesiredConditions(
            JobType desiredJobType,
            WorkType desiredWorkType,
            String desiredSido,
            String desiredSigungu,
            PayType desiredPayType,
            Integer desiredMinPay
    ) {
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

    public void updateDesiredConditions(DesiredConditions c) {
        this.desiredJobType = c.desiredJobType();
        this.desiredWorkType = c.desiredWorkType();
        this.desiredSido = c.desiredSido();
        this.desiredSigungu = c.desiredSigungu();
        this.desiredPayType = c.desiredPayType();
        this.desiredMinPay = c.desiredMinPay();
    }

    /**
     * 인적사항 + 표시용 필드 + 다중 희망조건 수정 폼.
     * 지정하지 않은(null / 빈 컬렉션) 값은 "없음"으로 그대로 덮어쓴다(부분수정 아님).
     */
    public record ProfileDetails(
            Gender gender,
            Integer birthYear,
            String photoUrl,
            Integer careerYears,
            EducationLevel education,
            String headline,
            Set<CareTask> availableTasks,
            Set<EmploymentType> desiredEmploymentTypes,
            String desiredWorkDays,
            LocalTime desiredWorkStartTime,
            LocalTime desiredWorkEndTime
    ) {
    }

    public void updateDetails(ProfileDetails d) {
        this.gender = d.gender();
        this.birthYear = d.birthYear();
        this.photoUrl = d.photoUrl();
        this.careerYears = d.careerYears();
        this.education = d.education();
        this.headline = d.headline();
        this.desiredWorkDays = d.desiredWorkDays();
        this.desiredWorkStartTime = d.desiredWorkStartTime();
        this.desiredWorkEndTime = d.desiredWorkEndTime();
        replace(this.availableTasks, d.availableTasks());
        replace(this.desiredEmploymentTypes, d.desiredEmploymentTypes());
    }

    private static <E extends Enum<E>> void replace(Set<E> target, Set<E> source) {
        target.clear();
        if (source != null && !source.isEmpty()) {
            target.addAll(EnumSet.copyOf(source));
        }
    }

    public void addCertificate(Certificate certificate) {
        certificates.add(certificate);
        certificate.assignProfile(this);
    }
}
