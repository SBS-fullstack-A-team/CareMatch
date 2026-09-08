package com.carematch.member.repository;

import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.CareTask;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.Gender;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.TalentSearchDtos.SearchCondition;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JobSeekerProfileSearchTest {

    @Autowired
    private JobSeekerProfileRepository repository;

    @Autowired
    private EntityManager em;

    private int seq = 0;

    private JobSeekerProfile persist(EmploymentStatus status) {
        seq++;
        Member m = Member.builder()
                .loginId("seeker" + seq).password("x").email("s" + seq + "@t.com").name("S" + seq)
                .phone("010-0000-000" + seq).role(Role.JOBSEEKER).verified(true).build();
        em.persist(m);
        JobSeekerProfile p = JobSeekerProfile.builder().member(m).employmentStatus(status).build();
        em.persist(p);
        return p;
    }

    private JobSeekerProfile seeker(EmploymentStatus status, JobType jobType, WorkType workType,
                                    String sido, String sigungu, PayType payType, Integer minPay) {
        JobSeekerProfile p = persist(status);
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                jobType, workType, sido, sigungu, payType, minPay));
        return p;
    }

    private void details(JobSeekerProfile p, Gender gender, Integer careerYears,
                         Set<CareTask> tasks, Set<EmploymentType> empTypes) {
        p.updateDetails(new JobSeekerProfile.ProfileDetails(
                gender, null, null, careerYears, null, null, tasks, empTypes,
                null, (LocalTime) null, (LocalTime) null));
    }

    private List<JobSeekerProfile> search(SearchCondition c) {
        return repository.findAll(JobSeekerProfileSpecs.from(c),
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "updatedAt"))).getContent();
    }

    /** 필요한 필터만 지정하는 헬퍼 (나머지는 null). */
    private static SearchCondition cond(JobType jt, WorkType wt, String sido, String sigungu,
                                        PayType pt, Integer payMax, Gender gender, Integer minCareerYears,
                                        List<CareTask> tasks, List<EmploymentType> empTypes,
                                        Boolean seekingOnly, Integer withinDays) {
        return new SearchCondition(jt, wt, sido, sigungu, pt, payMax, gender, minCareerYears,
                tasks, empTypes, seekingOnly, withinDays, null);
    }

    private static SearchCondition none() {
        return cond(null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void 기본은_구직중만() {
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, null, null, null, null);
        seeker(EmploymentStatus.EMPLOYED, JobType.CAREGIVER, null, null, null, null, null);

        assertThat(search(none())).hasSize(1);
        assertThat(search(cond(null, null, null, null, null, null, null, null, null, null, false, null))).hasSize(2);
    }

    @Test
    void 희망직종_지역_필터() {
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, "서울특별시", "강남구", null, null);
        seeker(EmploymentStatus.SEEKING, JobType.HOUSEKEEPER, null, "서울특별시", "강남구", null, null);
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, "부산광역시", "해운대구", null, null);

        assertThat(search(cond(JobType.CAREGIVER, null, null, null, null, null, null, null, null, null, null, null))).hasSize(2);
        assertThat(search(cond(JobType.CAREGIVER, null, "서울특별시", "강남구", null, null, null, null, null, null, null, null))).hasSize(1);
        assertThat(search(cond(null, null, null, "강남구", null, null, null, null, null, null, null, null))).hasSize(2);
    }

    @Test
    void 희망급여_상한_필터() {
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.HOURLY, 12_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.HOURLY, 15_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.MONTHLY, 2_500_000);

        assertThat(search(cond(null, null, null, null, PayType.HOURLY, 13_500, null, null, null, null, null, null))).hasSize(1);
    }

    @Test
    void 최근_갱신_필터() {
        JobSeekerProfile old = persist(EmploymentStatus.SEEKING);
        persist(EmploymentStatus.SEEKING);
        em.flush();
        em.createQuery("update JobSeekerProfile p set p.updatedAt = :t where p.id = :id")
                .setParameter("t", java.time.LocalDateTime.now().minusDays(40))
                .setParameter("id", old.getId())
                .executeUpdate();
        em.clear();

        assertThat(search(cond(null, null, null, null, null, null, null, null, null, null, null, 30))).hasSize(1);
    }

    @Test
    void 성별_경력_필터() {
        details(persist(EmploymentStatus.SEEKING), Gender.FEMALE, 5, null, null);
        details(persist(EmploymentStatus.SEEKING), Gender.MALE, 1, null, null);
        details(persist(EmploymentStatus.SEEKING), Gender.FEMALE, 0, null, null);
        em.flush();

        assertThat(search(cond(null, null, null, null, null, null, Gender.FEMALE, null, null, null, null, null))).hasSize(2);
        assertThat(search(cond(null, null, null, null, null, null, null, 3, null, null, null, null))).hasSize(1);
        assertThat(search(cond(null, null, null, null, null, null, Gender.FEMALE, 3, null, null, null, null))).hasSize(1);
    }

    @Test
    void 가능업무_고용형태_다중_필터_any_match() {
        details(persist(EmploymentStatus.SEEKING), null, null,
                Set.of(CareTask.MEAL_SUPPORT, CareTask.BATH_SUPPORT), Set.of(EmploymentType.FULL_TIME));
        details(persist(EmploymentStatus.SEEKING), null, null,
                Set.of(CareTask.MOBILITY_SUPPORT), Set.of(EmploymentType.PART_TIME, EmploymentType.CONTRACT));
        em.flush();
        em.clear();

        // MEAL_SUPPORT 또는 MOBILITY_SUPPORT 가능 → 둘 다
        assertThat(search(cond(null, null, null, null, null, null, null, null,
                List.of(CareTask.MEAL_SUPPORT, CareTask.MOBILITY_SUPPORT), null, null, null))).hasSize(2);
        // BATH_SUPPORT 가능 → 1명
        assertThat(search(cond(null, null, null, null, null, null, null, null,
                List.of(CareTask.BATH_SUPPORT), null, null, null))).hasSize(1);
        // PART_TIME 희망 → 1명
        assertThat(search(cond(null, null, null, null, null, null, null, null, null,
                List.of(EmploymentType.PART_TIME), null, null))).hasSize(1);
    }
}
