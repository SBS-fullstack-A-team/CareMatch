package com.carematch.jobposting.domain;

import com.carematch.common.converter.StringListConverter;
import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.member.domain.FacilityProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * 구인공고. 승인된 시설회원(FacilityProfile)이 등록한다.
 * 목록/상세 조회는 비로그인 공개, 등록/수정/삭제는 작성 시설 본인만.
 *
 * 카테고리성 값은 전부 enum, 다중값(주요업무/자격요건)은 @Convert 콤마 문자열.
 * 지원마감일(deadline)은 노출옵션 만료(exposureExpiredAt)와 별개다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "job_posting", indexes = {
        @Index(name = "idx_job_posting_status_region", columnList = "status, sigungu, job_type"),
        @Index(name = "idx_job_posting_deadline", columnList = "deadline")
})
public class JobPosting extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facility_profile_id", nullable = false)
    private FacilityProfile facilityProfile;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 20)
    private JobType jobType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** 대표 이미지 URL (목록 카드 / 상세 사이드바 썸네일). 프론트가 업로드 후 최종 URL 을 넘긴다. 선택. */
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    /** 스페셜 카드 홍보 문구 (SPECIAL 노출 시). 선택. */
    @Column(name = "catchphrase", length = 100)
    private String catchphrase;

    // ===== 근무조건 =====

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 20)
    private WorkType workType;

    /** 근무 시간대(주간/오전/오후/야간/교대). 입주형은 시간대 개념이 없어 null 허용. */
    @Enumerated(EnumType.STRING)
    @Column(name = "work_schedule", length = 20)
    private WorkSchedule workSchedule;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 20)
    private EmploymentType employmentType;

    /** 고용형태 부가설명 (예: "3개월 후 정규직 전환 가능"). */
    @Column(name = "employment_type_note", length = 200)
    private String employmentTypeNote;

    /** 근무요일 자유 표기 (예: "월~금 (주 5일)"). */
    @Column(name = "work_days", nullable = false, length = 100)
    private String workDays;

    @Column(name = "work_start_time", nullable = false)
    private LocalTime workStartTime;

    @Column(name = "work_end_time", nullable = false)
    private LocalTime workEndTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "pay_type", nullable = false, length = 20)
    private PayType payType;

    @Column(name = "pay_amount", nullable = false)
    private Integer payAmount;

    @Column(name = "recruit_count", nullable = false)
    private Integer recruitCount;

    /** 지원 마감일. */
    @Column(name = "deadline", nullable = false)
    private LocalDate deadline;

    // ===== 근무지 =====

    @Column(name = "sido", nullable = false, length = 30)
    private String sido;

    @Column(name = "sigungu", nullable = false, length = 30)
    private String sigungu;

    @Column(name = "address_detail", length = 200)
    private String addressDetail;

    /** 근무지 위도/경도 (지도 표시용, 선택). 프론트가 지오코딩해서 넘긴다. */
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // ===== 어르신 정보 =====

    @Enumerated(EnumType.STRING)
    @Column(name = "care_grade", nullable = false, length = 20)
    private CareGrade careGrade;

    @Enumerated(EnumType.STRING)
    @Column(name = "elder_gender", nullable = false, length = 10)
    private ElderGender elderGender;

    /** 연령대 자유 표기 (예: "70대"). */
    @Column(name = "elder_age_range", length = 20)
    private String elderAgeRange;

    @Enumerated(EnumType.STRING)
    @Column(name = "mobility_status", nullable = false, length = 20)
    private MobilityStatus mobilityStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_status", nullable = false, length = 20)
    private MealStatus mealStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "cognitive_status", nullable = false, length = 20)
    private CognitiveStatus cognitiveStatus;

    /** 어르신 특이사항 자유 기술 (낙상 주의, 알레르기, 과거 병력 등). 선택. */
    @Column(name = "elder_note", columnDefinition = "TEXT")
    private String elderNote;

    // ===== 다중값 (콤마 문자열, 검색조건 아님) =====

    /** 주요 업무 (예: 말벗, 식사준비, 청소, 병원동행). */
    @Convert(converter = StringListConverter.class)
    @Column(name = "duties", length = 500)
    private List<String> duties;

    /** 자격요건 / 제출서류 (예: 요양보호사 자격증, 이력서, 건강검진서). */
    @Convert(converter = StringListConverter.class)
    @Column(name = "required_documents", length = 500)
    private List<String> requiredDocuments;

    /** 자격 요건 (예: "요양보호사 자격증 소지", "경력 1년 이상"). 상세 화면 불릿. */
    @Convert(converter = StringListConverter.class)
    @Column(name = "requirements", length = 2000)
    private List<String> requirements;

    /** 우대사항 (예: "요양원 근무 경험자", "인근 거주자"). 상세 화면 불릿. */
    @Convert(converter = StringListConverter.class)
    @Column(name = "preferences", length = 2000)
    private List<String> preferences;

    /** 복리후생 (예: "4대보험", "중식 제공", "명절 상여금"). 상세 화면 불릿. */
    @Convert(converter = StringListConverter.class)
    @Column(name = "benefits", length = 2000)
    private List<String> benefits;

    /** 최소 요구 경력(년). null 또는 0 = 경력무관. 목록 카드 태그·매칭에 사용. */
    @Column(name = "min_career_years")
    private Integer minCareerYears;

    // ===== 상태 / 노출 =====

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private JobPostingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "exposure_type", nullable = false, length = 20)
    private ExposureType exposureType;

    /** RECOMMENDED / 비슷한공고 정렬용. exposureType.priority 를 비정규화 (SQL 정렬을 문자열에 의존하지 않기 위함). */
    @Column(name = "exposure_priority", nullable = false)
    private int exposurePriority;

    @Column(name = "exposure_expired_at")
    private LocalDateTime exposureExpiredAt;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    @Builder
    private JobPosting(FacilityProfile facilityProfile, String title, JobType jobType, String description,
                       String thumbnailUrl, String catchphrase,
                       WorkType workType, WorkSchedule workSchedule,
                       EmploymentType employmentType, String employmentTypeNote,
                       String workDays, LocalTime workStartTime, LocalTime workEndTime,
                       PayType payType, Integer payAmount, Integer recruitCount, LocalDate deadline,
                       String sido, String sigungu, String addressDetail, Double latitude, Double longitude,
                       CareGrade careGrade, ElderGender elderGender, String elderAgeRange,
                       MobilityStatus mobilityStatus, MealStatus mealStatus, CognitiveStatus cognitiveStatus,
                       String elderNote,
                       List<String> duties, List<String> requiredDocuments,
                       List<String> requirements, List<String> preferences, List<String> benefits,
                       Integer minCareerYears, ExposureType exposureType) {
        this.facilityProfile = facilityProfile;
        this.title = title;
        this.jobType = jobType;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.catchphrase = catchphrase;
        this.workType = workType;
        this.workSchedule = workSchedule;
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
        this.latitude = latitude;
        this.longitude = longitude;
        this.careGrade = careGrade;
        this.elderGender = elderGender;
        this.elderAgeRange = elderAgeRange;
        this.mobilityStatus = mobilityStatus;
        this.mealStatus = mealStatus;
        this.cognitiveStatus = cognitiveStatus;
        this.elderNote = elderNote;
        this.duties = duties;
        this.requiredDocuments = requiredDocuments;
        this.requirements = requirements;
        this.preferences = preferences;
        this.benefits = benefits;
        this.minCareerYears = minCareerYears;
        this.status = JobPostingStatus.OPEN;
        this.exposureType = exposureType == null ? ExposureType.NORMAL : exposureType;
        this.exposurePriority = this.exposureType.getPriority();
        this.viewCount = 0L;
    }

    /** 공고 수정 폼. 노출옵션/상태/조회수는 이 경로로 바꾸지 않는다. */
    public record UpdateForm(
            String title, JobType jobType, String description, String thumbnailUrl, String catchphrase,
            WorkType workType, WorkSchedule workSchedule,
            EmploymentType employmentType, String employmentTypeNote,
            String workDays, LocalTime workStartTime, LocalTime workEndTime,
            PayType payType, Integer payAmount, Integer recruitCount, LocalDate deadline,
            String sido, String sigungu, String addressDetail, Double latitude, Double longitude,
            CareGrade careGrade, ElderGender elderGender, String elderAgeRange,
            MobilityStatus mobilityStatus, MealStatus mealStatus, CognitiveStatus cognitiveStatus,
            String elderNote,
            List<String> duties, List<String> requiredDocuments,
            List<String> requirements, List<String> preferences, List<String> benefits,
            Integer minCareerYears
    ) {
    }

    public void update(UpdateForm f) {
        this.title = f.title();
        this.jobType = f.jobType();
        this.description = f.description();
        this.thumbnailUrl = f.thumbnailUrl();
        this.catchphrase = f.catchphrase();
        this.workType = f.workType();
        this.workSchedule = f.workSchedule();
        this.employmentType = f.employmentType();
        this.employmentTypeNote = f.employmentTypeNote();
        this.workDays = f.workDays();
        this.workStartTime = f.workStartTime();
        this.workEndTime = f.workEndTime();
        this.payType = f.payType();
        this.payAmount = f.payAmount();
        this.recruitCount = f.recruitCount() == null ? 1 : f.recruitCount();
        this.deadline = f.deadline();
        this.sido = f.sido();
        this.sigungu = f.sigungu();
        this.addressDetail = f.addressDetail();
        this.latitude = f.latitude();
        this.longitude = f.longitude();
        this.careGrade = f.careGrade();
        this.elderGender = f.elderGender();
        this.elderAgeRange = f.elderAgeRange();
        this.mobilityStatus = f.mobilityStatus();
        this.mealStatus = f.mealStatus();
        this.cognitiveStatus = f.cognitiveStatus();
        this.elderNote = f.elderNote();
        this.duties = f.duties();
        this.requiredDocuments = f.requiredDocuments();
        this.requirements = f.requirements();
        this.preferences = f.preferences();
        this.benefits = f.benefits();
        this.minCareerYears = f.minCareerYears();
    }

    public void close() {
        this.status = JobPostingStatus.CLOSED;
    }

    /** 프리미엄/스페셜 노출 옵션 구매 시 노출 만료 시각을 설정한다 (기본 7일). */
    public void applyExposure(int days) {
        this.exposureExpiredAt = LocalDateTime.now().plusDays(days);
    }

    /** 노출 옵션 만료 시 NORMAL 로 강등 (스케줄러가 호출). 정렬 우선순위도 함께 0 으로 내린다. */
    public void demoteExposure() {
        this.exposureType = ExposureType.NORMAL;
        this.exposurePriority = ExposureType.NORMAL.getPriority();
    }

    /** 상세 조회 시 1 증가. 동시성 정합성은 데모 수준만 보장. */
    public void increaseViewCount() {
        this.viewCount++;
    }

    public boolean isOwnedBy(Long memberId) {
        return facilityProfile.getMember().getId().equals(memberId);
    }
}
