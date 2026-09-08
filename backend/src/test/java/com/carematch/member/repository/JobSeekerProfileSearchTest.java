package com.carematch.member.repository;

import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.EmploymentStatus;
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

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JobSeekerProfileSearchTest {

    @Autowired
    private JobSeekerProfileRepository repository;

    @Autowired
    private EntityManager em;

    private int seq = 0;

    private JobSeekerProfile seeker(EmploymentStatus status, JobType jobType, WorkType workType,
                                    String sido, String sigungu, PayType payType, Integer minPay) {
        seq++;
        Member m = Member.builder()
                .loginId("seeker" + seq).password("x").email("s" + seq + "@t.com").name("S" + seq)
                .phone("010-0000-000" + seq).role(Role.JOBSEEKER).verified(true).build();
        em.persist(m);
        JobSeekerProfile p = JobSeekerProfile.builder().member(m).employmentStatus(status).build();
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                jobType, workType, sido, sigungu, payType, minPay));
        em.persist(p);
        return p;
    }

    private java.util.List<JobSeekerProfile> search(SearchCondition c) {
        return repository.findAll(JobSeekerProfileSpecs.from(c),
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "updatedAt"))).getContent();
    }

    private static SearchCondition cond(JobType jt, WorkType wt, String sido, String sigungu,
                                        PayType pt, Integer payMax, Boolean seekingOnly, Integer withinDays) {
        return new SearchCondition(jt, wt, sido, sigungu, pt, payMax, seekingOnly, withinDays, null);
    }

    @Test
    void 기본은_구직중만() {
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, null, null, null, null);
        seeker(EmploymentStatus.EMPLOYED, JobType.CAREGIVER, null, null, null, null, null);

        assertThat(search(cond(null, null, null, null, null, null, null, null))).hasSize(1);
        assertThat(search(cond(null, null, null, null, null, null, false, null))).hasSize(2);
    }

    @Test
    void 희망직종_지역_필터() {
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, "서울특별시", "강남구", null, null);
        seeker(EmploymentStatus.SEEKING, JobType.HOUSEKEEPER, null, "서울특별시", "강남구", null, null);
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, "부산광역시", "해운대구", null, null);

        assertThat(search(cond(JobType.CAREGIVER, null, null, null, null, null, null, null))).hasSize(2);
        assertThat(search(cond(JobType.CAREGIVER, null, "서울특별시", "강남구", null, null, null, null))).hasSize(1);
        assertThat(search(cond(null, null, null, "강남구", null, null, null, null))).hasSize(2);
    }

    @Test
    void 희망급여_상한_필터() {
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.HOURLY, 12_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.HOURLY, 15_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.MONTHLY, 2_500_000);

        // 시급 13,500 이하 → 12,000 짜리 1명 (급여유형도 함께)
        assertThat(search(cond(null, null, null, null, PayType.HOURLY, 13_500, null, null))).hasSize(1);
    }

    @Test
    void 최근_갱신_필터() {
        JobSeekerProfile old = seeker(EmploymentStatus.SEEKING, null, null, null, null, null, null);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, null, null);
        em.flush();
        // old 의 updatedAt 을 40일 전으로
        em.createQuery("update JobSeekerProfile p set p.updatedAt = :t where p.id = :id")
                .setParameter("t", java.time.LocalDateTime.now().minusDays(40))
                .setParameter("id", old.getId())
                .executeUpdate();
        em.clear();

        assertThat(search(cond(null, null, null, null, null, null, null, 30))).hasSize(1);
    }
}
