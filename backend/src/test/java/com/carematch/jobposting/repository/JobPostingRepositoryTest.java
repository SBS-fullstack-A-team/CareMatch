package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.CognitiveStatus;
import com.carematch.jobposting.domain.ElderGender;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MealStatus;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JobPostingRepositoryTest {

    @Autowired
    private JobPostingRepository repository;

    @Autowired
    private EntityManager em;

    private FacilityProfile facility;

    @BeforeEach
    void setUp() {
        Member member = Member.builder()
                .loginId("fac-repo-test").password("x").email("fac@test.com").name("F").phone("010-0000-0000")
                .role(Role.FACILITY).verified(true)
                .build();
        em.persist(member);
        facility = FacilityProfile.builder()
                .member(member).facilityName("C").businessRegistrationNumber("123-45-67890")
                .build();
        em.persist(facility);
    }

    /** 실제 서비스와 동일하게, NORMAL 이 아니면 노출 만료를 7일 후로 잡는다. */
    private JobPosting posting(ExposureType exposure) {
        JobPosting jp = JobPosting.builder()
                .facilityProfile(facility)
                .title("t").jobType(JobType.CAREGIVER)
                .workType(WorkType.COMMUTE).employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(PayType.MONTHLY).payAmount(3_000_000).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Gangnam")
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL)
                .exposureType(exposure)
                .build();
        if (exposure != ExposureType.NORMAL) {
            jp.applyExposure(7);
        }
        em.persist(jp);
        return jp;
    }

    @Test
    void 상세필드_요건_우대_복리후생_경력_문구가_저장되고_응답에_담긴다() {
        JobPosting jp = JobPosting.builder()
                .facilityProfile(facility)
                .title("t").jobType(JobType.CAREGIVER)
                .workType(WorkType.COMMUTE).employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(PayType.MONTHLY).payAmount(3_000_000).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Gangnam")
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL)
                .requirements(java.util.List.of("요양보호사 자격증 소지"))
                .preferences(java.util.List.of("인근 거주자", "요양원 근무 경험자"))
                .benefits(java.util.List.of("4대보험", "중식 제공"))
                .minCareerYears(1)
                .catchphrase("가족처럼 모실 분을 찾습니다")
                .build();
        em.persist(jp);
        em.flush();
        em.clear();

        JobPosting reloaded = repository.findById(jp.getId()).orElseThrow();
        var res = com.carematch.jobposting.dto.JobPostingDtos.DetailResponse.from(reloaded, null);

        assertThat(res.requirements()).containsExactly("요양보호사 자격증 소지");
        assertThat(res.preferences()).containsExactly("인근 거주자", "요양원 근무 경험자");
        assertThat(res.benefits()).containsExactly("4대보험", "중식 제공");
        assertThat(res.minCareerYears()).isEqualTo(1);
        assertThat(res.catchphrase()).isEqualTo("가족처럼 모실 분을 찾습니다");
        assertThat(res.managerName()).isEqualTo("F"); // 시설회원 이름
    }

    @Test
    void exposurePriority_는_등록_시_exposureType_우선순위로_채워진다() {
        JobPosting normal = posting(ExposureType.NORMAL);
        JobPosting special = posting(ExposureType.SPECIAL);
        em.flush();

        assertThat(normal.getExposurePriority()).isZero();
        assertThat(special.getExposurePriority()).isEqualTo(ExposureType.SPECIAL.getPriority());
    }

    @Test
    void demoteExpiredExposures_는_만료된_비NORMAL_공고만_강등한다() {
        JobPosting special = posting(ExposureType.SPECIAL);   // 노출 만료 7일 후
        JobPosting normal = posting(ExposureType.NORMAL);
        em.flush();
        em.clear();

        // 8일 뒤 시점으로 강등 실행 → SPECIAL 만 만료 대상
        int demoted = repository.demoteExpiredExposures(LocalDateTime.now().plusDays(8));

        assertThat(demoted).isEqualTo(1);
        JobPosting reloaded = repository.findById(special.getId()).orElseThrow();
        assertThat(reloaded.getExposureType()).isEqualTo(ExposureType.NORMAL);
        assertThat(reloaded.getExposurePriority()).isZero();
        assertThat(repository.findById(normal.getId()).orElseThrow().getExposureType())
                .isEqualTo(ExposureType.NORMAL);
    }

    @Test
    void 비슷한공고_정렬은_exposurePriority_DESC() {
        posting(ExposureType.NORMAL);
        JobPosting special = posting(ExposureType.SPECIAL);
        posting(ExposureType.PREMIUM);
        em.flush();
        em.clear();

        var list = repository.findTop6ByStatusAndSigunguAndJobTypeAndIdNotOrderByExposurePriorityDescCreatedAtDesc(
                JobPostingStatus.OPEN, "Gangnam", JobType.CAREGIVER, -1L);

        assertThat(list).hasSize(3);
        assertThat(list.get(0).getId()).isEqualTo(special.getId());
        assertThat(list).extracting(JobPosting::getExposurePriority).isSortedAccordingTo((a, b) -> b - a);
    }
}
