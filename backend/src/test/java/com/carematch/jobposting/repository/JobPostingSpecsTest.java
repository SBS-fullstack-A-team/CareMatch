package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.CognitiveStatus;
import com.carematch.jobposting.domain.ElderGender;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MealStatus;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.jobposting.dto.JobPostingDtos.SearchCondition;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JobPostingSpecsTest {

    @Autowired
    private JobPostingRepository repository;

    @Autowired
    private EntityManager em;

    private FacilityProfile facility;

    @BeforeEach
    void setUp() {
        Member member = Member.builder()
                .loginId("fac-specs-test").password("x").email("specs@test.com").name("F").phone("010-0000-0000")
                .role(Role.FACILITY).verified(true)
                .build();
        em.persist(member);
        facility = FacilityProfile.builder()
                .member(member).facilityName("C").businessRegistrationNumber("321-54-09876")
                .build();
        em.persist(facility);
    }

    private JobPosting posting(PayType payType, int payAmount) {
        JobPosting jp = JobPosting.builder()
                .facilityProfile(facility)
                .title("t").jobType(JobType.CAREGIVER)
                .workType(WorkType.COMMUTE).employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(payType).payAmount(payAmount).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Gangnam")
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL)
                .exposureType(ExposureType.NORMAL)
                .build();
        em.persist(jp);
        return jp;
    }

    private SearchCondition payTypes(List<PayType> payTypes) {
        return new SearchCondition(null, null, null, null, null, null, null, payTypes, null, null, null);
    }

    @Test
    void payTypes_다중선택은_OR_로_필터된다() {
        posting(PayType.HOURLY, 13_000);
        posting(PayType.DAILY, 120_000);
        posting(PayType.MONTHLY, 2_900_000);
        em.flush();
        em.clear();

        List<JobPosting> result = repository.findAll(
                JobPostingSpecs.from(payTypes(List.of(PayType.HOURLY, PayType.MONTHLY))), Pageable.unpaged())
                .getContent();

        assertThat(result).extracting(JobPosting::getPayType)
                .containsExactlyInAnyOrder(PayType.HOURLY, PayType.MONTHLY);
    }

    @Test
    void payTypes_가_null_이거나_비어있으면_급여형태로_거르지_않는다() {
        posting(PayType.HOURLY, 13_000);
        posting(PayType.MONTHLY, 2_900_000);
        em.flush();
        em.clear();

        assertThat(repository.findAll(JobPostingSpecs.from(payTypes(null)), Pageable.unpaged())).hasSize(2);
        assertThat(repository.findAll(JobPostingSpecs.from(payTypes(List.of())), Pageable.unpaged())).hasSize(2);
    }
}
