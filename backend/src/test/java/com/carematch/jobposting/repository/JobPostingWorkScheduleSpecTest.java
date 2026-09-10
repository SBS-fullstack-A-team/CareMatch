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
import com.carematch.jobposting.domain.WorkSchedule;
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
class JobPostingWorkScheduleSpecTest {

    @Autowired
    private JobPostingRepository repository;

    @Autowired
    private EntityManager em;

    private FacilityProfile facility;

    @BeforeEach
    void setUp() {
        Member member = Member.builder()
                .loginId("fac-ws-test").password("x").email("ws@test.com").name("F").phone("010-0000-0000")
                .role(Role.FACILITY).verified(true)
                .build();
        em.persist(member);
        facility = FacilityProfile.builder()
                .member(member).facilityName("C").businessRegistrationNumber("987-65-43210")
                .build();
        em.persist(facility);
    }

    private void posting(WorkSchedule schedule) {
        JobPosting jp = JobPosting.builder()
                .facilityProfile(facility)
                .title("t").jobType(JobType.CAREGIVER)
                .workType(WorkType.COMMUTE).workSchedule(schedule)
                .employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(PayType.MONTHLY).payAmount(3_000_000).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Gangnam")
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL)
                .exposureType(ExposureType.NORMAL)
                .build();
        em.persist(jp);
    }

    private SearchCondition workSchedules(List<WorkSchedule> schedules) {
        return new SearchCondition(null, null, null, null, schedules, null, null, null,
                null, null, null, null);
    }

    @Test
    void workSchedules_다중선택은_OR_로_필터된다() {
        posting(WorkSchedule.DAY);
        posting(WorkSchedule.NIGHT);
        posting(WorkSchedule.SHIFT);
        posting(null); // 입주형처럼 시간대 미지정
        em.flush();
        em.clear();

        List<JobPosting> result = repository.findAll(
                JobPostingSpecs.from(workSchedules(List.of(WorkSchedule.DAY, WorkSchedule.SHIFT))),
                Pageable.unpaged()).getContent();

        assertThat(result).extracting(JobPosting::getWorkSchedule)
                .containsExactlyInAnyOrder(WorkSchedule.DAY, WorkSchedule.SHIFT);
    }

    @Test
    void workSchedules_가_비어있으면_시간대로_거르지_않는다() {
        posting(WorkSchedule.DAY);
        posting(null);
        em.flush();
        em.clear();

        assertThat(repository.findAll(JobPostingSpecs.from(workSchedules(null)), Pageable.unpaged())).hasSize(2);
        assertThat(repository.findAll(JobPostingSpecs.from(workSchedules(List.of())), Pageable.unpaged())).hasSize(2);
    }
}
