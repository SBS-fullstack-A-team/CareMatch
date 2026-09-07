package com.carematch.entity;

import com.carematch.global.converter.StringListConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import java.time.LocalTime;
import java.util.List;

@Getter
@Entity
@Table(name = "job_posting")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JobPosting extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false)
    private JobType jobType;

    /** 상세 내용 자유 서술. */
    @Column(columnDefinition = "TEXT")
    private String description;

    // ===== 근무조건 =====

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false)
    private WorkType workType;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false)
    private EmploymentType employmentType;

    /** 고용형태 부가설명 (예: "3개월 후 정규직 전환 가능"). */
    @Column(name = "employment_type_note")
    private String employmentTypeNote;

    /** 근무요일 자유 표기 (예: "월~금 (주 5일)"). */
    @Column(name = "work_days", nullable = false)
    private String workDays;

    @Column(name = "work_start_time", nullable = false)
    private LocalTime workStartTime;

    @Column(name = "work_end_time", nullable = false)
    private LocalTime workEndTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "pay_type", nullable = false)
    private PayType payType;

    @Column(name = "pay_amount", nullable = false)
    private Integer payAmount;

    @Column(name = "recruit_count", nullable = false)
    private Integer recruitCount;

    /** 지원 마감일 (노출 만료 exposureExpiredAt 와는 별개). */
    @Column(nullable = false)
    private LocalDate deadline;

    // ===== 근무지 =====

    @Column(nullable = false)
    private String sido;

    @Column(nullable = false)
    private String sigungu;

    /** 상세주소 (도로명 + 동 등). 비공개 정책 없이 그대로 공개. */
    @Column(name = "address_detail")
    private String addressDetail;

    // ===== 어르신 정보 =====

    @Enumerated(EnumType.STRING)
    @Column(name = "care_grade", nullable = false)
    private CareGrade careGrade;

    @Enumerated(EnumType.STRING)
    @Column(name = "elder_gender", nullable = false)
    private Gender elderGender;

    /** 연령대 자유 표기 (예: "70대"). */
    @Column(name = "elder_age_range")
    private String elderAgeRange;

    @Enumerated(EnumType.STRING)
    @Column(name = "mobility_status", nullable = false)
    private MobilityStatus mobilityStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_status", nullable = false)
    private MealStatus mealStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "cognitive_status", nullable = false)
    private CognitiveStatus cognitiveStatus;

    // ===== 다중값 (콤마 문자열 저장, 검색 조건으로는 사용하지 않음) =====

    /** 주요 업무 (예: 말벗, 식사준비, 청소, 병원동행). */
    @Convert(converter = StringListConverter.class)
    @Column(length = 1000)
    private List<String> duties;

    /** 자격요건 / 제출서류 (예: 요양보호사 자격증, 이력서, 건강검진서). */
    @Convert(converter = StringListConverter.class)
    @Column(name = "required_documents", length = 1000)
    private List<String> requiredDocuments;

    // ===== 상태 / 노출 =====

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobPostingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "exposure_type", nullable = false)
    private ExposureType exposureType;

    @Column(name = "exposure_expired_at")
    private LocalDateTime exposureExpiredAt;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    @Builder
    public JobPosting(Member member, String title, JobType jobType, String description,
                      WorkType workType, EmploymentType employmentType, String employmentTypeNote,
                      String workDays, LocalTime workStartTime, LocalTime workEndTime,
                      PayType payType, Integer payAmount, Integer recruitCount, LocalDate deadline,
                      String sido, String sigungu, String addressDetail,
                      CareGrade careGrade, Gender elderGender, String elderAgeRange,
                      MobilityStatus mobilityStatus, MealStatus mealStatus, CognitiveStatus cognitiveStatus,
                      List<String> duties, List<String> requiredDocuments, ExposureType exposureType) {
        this.member = member;
        this.title = title;
        this.jobType = jobType;
        this.description = description;
        this.workType = workType;
        this.employmentType = employmentType;
        this.employmentTypeNote = employmentTypeNote;
        this.workDays = workDays;
        this.workStartTime = workStartTime;
        this.workEndTime = workEndTime;
        this.payType = payType;
        this.payAmount = payAmount;
        this.recruitCount = recruitCount == null ? 1 : recruitCount;
        this.deadline = deadline;
        this.sido = sido;
        this.sigungu = sigungu;
        this.addressDetail = addressDetail;
        this.careGrade = careGrade;
        this.elderGender = elderGender;
        this.elderAgeRange = elderAgeRange;
        this.mobilityStatus = mobilityStatus;
        this.mealStatus = mealStatus;
        this.cognitiveStatus = cognitiveStatus;
        this.duties = duties;
        this.requiredDocuments = requiredDocuments;
        this.status = JobPostingStatus.OPEN;
        this.exposureType = exposureType == null ? ExposureType.NORMAL : exposureType;
        this.viewCount = 0L;
    }

    /** 공고 수정 폼. 노출옵션/상태/조회수는 이 경로로 바꾸지 않는다. */
    public record UpdateForm(
            String title, JobType jobType, String description,
            WorkType workType, EmploymentType employmentType, String employmentTypeNote,
            String workDays, LocalTime workStartTime, LocalTime workEndTime,
            PayType payType, Integer payAmount, Integer recruitCount, LocalDate deadline,
            String sido, String sigungu, String addressDetail,
            CareGrade careGrade, Gender elderGender, String elderAgeRange,
            MobilityStatus mobilityStatus, MealStatus mealStatus, CognitiveStatus cognitiveStatus,
            List<String> duties, List<String> requiredDocuments
    ) {
    }

    public void update(UpdateForm form) {
        this.title = form.title();
        this.jobType = form.jobType();
        this.description = form.description();
        this.workType = form.workType();
        this.employmentType = form.employmentType();
        this.employmentTypeNote = form.employmentTypeNote();
        this.workDays = form.workDays();
        this.workStartTime = form.workStartTime();
        this.workEndTime = form.workEndTime();
        this.payType = form.payType();
        this.payAmount = form.payAmount();
        this.recruitCount = form.recruitCount() == null ? 1 : form.recruitCount();
        this.deadline = form.deadline();
        this.sido = form.sido();
        this.sigungu = form.sigungu();
        this.addressDetail = form.addressDetail();
        this.careGrade = form.careGrade();
        this.elderGender = form.elderGender();
        this.elderAgeRange = form.elderAgeRange();
        this.mobilityStatus = form.mobilityStatus();
        this.mealStatus = form.mealStatus();
        this.cognitiveStatus = form.cognitiveStatus();
        this.duties = form.duties();
        this.requiredDocuments = form.requiredDocuments();
    }

    public void close() {
        this.status = JobPostingStatus.CLOSED;
    }

    /** 프리미엄/스페셜 노출 옵션 구매 시 노출 만료 시각을 설정한다 (기본 7일). */
    public void extendExposure(int days) {
        this.exposureExpiredAt = LocalDateTime.now().plusDays(days);
    }

    /** 상세 조회 시 1 증가. 동시성 정합성은 데모 수준만 보장. */
    public void increaseViewCount() {
        this.viewCount++;
    }

    public boolean isOwnedBy(Long memberId) {
        return this.member.getId().equals(memberId);
    }
}
