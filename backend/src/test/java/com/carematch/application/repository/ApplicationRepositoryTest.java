package com.carematch.application.repository;

import com.carematch.application.domain.Application;
import com.carematch.application.domain.ApplicationStatus;
import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.CognitiveStatus;
import com.carematch.jobposting.domain.ElderGender;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MealStatus;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class ApplicationRepositoryTest {

    @Autowired
    private ApplicationRepository repository;
    @Autowired
    private EntityManager em;

    private JobPosting posting;
    private JobSeekerProfile seekerA;
    private JobSeekerProfile seekerB;
    private Long seekerAMemberId;

    private int seq = 0;

    private Member member(Role role) {
        seq++;
        Member m = Member.builder()
                .loginId("m" + seq).password("x").email("m" + seq + "@t.com").name("M" + seq)
                .phone("010-0000-000" + seq).role(role).verified(true).build();
        em.persist(m);
        return m;
    }

    @BeforeEach
    void setUp() {
        FacilityProfile facility = FacilityProfile.builder()
                .member(member(Role.FACILITY)).facilityName("F").businessRegistrationNumber("123-45-67890").build();
        em.persist(facility);
        posting = JobPosting.builder()
                .facilityProfile(facility).title("t").jobType(JobType.CAREGIVER)
                .workType(WorkType.COMMUTE).employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(PayType.MONTHLY).payAmount(3_000_000).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Gangnam")
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL).build();
        em.persist(posting);

        Member ma = member(Role.JOBSEEKER);
        seekerAMemberId = ma.getId();
        seekerA = JobSeekerProfile.builder().member(ma).employmentStatus(EmploymentStatus.SEEKING).build();
        em.persist(seekerA);
        seekerB = JobSeekerProfile.builder().member(member(Role.JOBSEEKER)).employmentStatus(EmploymentStatus.SEEKING).build();
        em.persist(seekerB);
    }

    private Application apply(JobSeekerProfile seeker) {
        Application a = Application.builder().jobPosting(posting).jobSeekerProfile(seeker).message(null).build();
        em.persist(a);
        return a;
    }

    @Test
    void 같은_공고_같은_지원자_중복_저장_불가() {
        repository.saveAndFlush(
                Application.builder().jobPosting(posting).jobSeekerProfile(seekerA).message(null).build());
        assertThatThrownBy(() -> repository.saveAndFlush(
                Application.builder().jobPosting(posting).jobSeekerProfile(seekerA).message(null).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findByJobPostingIdAndJobSeekerProfileId() {
        Application a = apply(seekerA);
        em.flush();
        em.clear();
        assertThat(repository.findByJobPostingIdAndJobSeekerProfileId(posting.getId(), seekerA.getId()))
                .get().extracting(Application::getId).isEqualTo(a.getId());
        assertThat(repository.findByJobPostingIdAndJobSeekerProfileId(posting.getId(), seekerB.getId())).isEmpty();
    }

    @Test
    void 지원자_목록_status_필터() {
        apply(seekerA);
        Application b = apply(seekerB);
        b.cancel();
        em.flush();
        em.clear();

        assertThat(repository.findApplicantsOfPosting(posting.getId(), null, PageRequest.of(0, 10)).getContent())
                .hasSize(2);
        assertThat(repository.findApplicantsOfPosting(posting.getId(), ApplicationStatus.APPLIED, PageRequest.of(0, 10)).getContent())
                .hasSize(1);
    }

    @Test
    void 내_지원목록_member_기준() {
        apply(seekerA);
        em.flush();
        em.clear();

        assertThat(repository.findMyApplications(seekerAMemberId, null, PageRequest.of(0, 10)).getContent())
                .hasSize(1);
        assertThat(repository.findMyApplications(seekerAMemberId, ApplicationStatus.ACCEPTED, PageRequest.of(0, 10)).getContent())
                .isEmpty();
    }
}
