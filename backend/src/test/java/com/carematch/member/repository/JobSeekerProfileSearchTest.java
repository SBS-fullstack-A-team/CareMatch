package com.carematch.member.repository;

import com.carematch.certificate.domain.Certificate;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.CareTask;
import com.carematch.member.domain.DesiredRegion;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.Gender;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.TalentSearchDtos.CareerBucket;
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
        List<DesiredRegion> regions = sido == null ? List.of() : List.of(new DesiredRegion(sido, sigungu));
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                jobType, workType, null, regions, payType, minPay));
        return p;
    }

    private JobSeekerProfile seekerWithSchedule(WorkSchedule schedule) {
        JobSeekerProfile p = persist(EmploymentStatus.SEEKING);
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                null, null, schedule, List.of(), null, null));
        return p;
    }

    private JobSeekerProfile seekerWithRegions(DesiredRegion... regions) {
        JobSeekerProfile p = persist(EmploymentStatus.SEEKING);
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                null, null, null, List.of(regions), null, null));
        return p;
    }

    private void details(JobSeekerProfile p, Gender gender, Integer careerYears,
                         Set<CareTask> tasks, Set<EmploymentType> empTypes) {
        p.updateDetails(new JobSeekerProfile.ProfileDetails(
                gender, null, null, careerYears, null, null, tasks, empTypes,
                null, (LocalTime) null, (LocalTime) null));
    }

    private void certificate(JobSeekerProfile p, String name) {
        em.persist(Certificate.builder()
                .jobSeekerProfile(p).certificateName(name).certificateNumber("n").fileKey("k")
                .build());
    }

    private List<JobSeekerProfile> search(SearchCondition c) {
        return repository.findAll(JobSeekerProfileSpecs.from(c),
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "updatedAt"))).getContent();
    }

    /** 필요한 필터만 지정하는 헬퍼 (나머지는 null). desiredWorkSchedules 는 {@link #condWs} 사용. */
    private static SearchCondition cond(JobType jt, WorkType wt, String sido, String sigungu,
                                        List<PayType> payTypes, Integer payMax, Gender gender,
                                        List<CareerBucket> careerBuckets,
                                        List<CareTask> tasks, List<EmploymentType> empTypes,
                                        List<String> certificateNames,
                                        Boolean seekingOnly, Integer withinDays) {
        return new SearchCondition(jt, wt, null, sido, sigungu, payTypes, payMax, gender, careerBuckets,
                tasks, empTypes, certificateNames, seekingOnly, withinDays, null);
    }

    /** 희망 근무 시간대 필터만 지정하는 헬퍼. */
    private static SearchCondition condWs(List<WorkSchedule> workSchedules) {
        return new SearchCondition(null, null, workSchedules, null, null, null, null, null, null,
                null, null, null, null, null, null);
    }

    private static SearchCondition none() {
        return cond(null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void 기본은_구직중만() {
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, null, null, null, null);
        seeker(EmploymentStatus.EMPLOYED, JobType.CAREGIVER, null, null, null, null, null);

        assertThat(search(none())).hasSize(1);
        assertThat(search(cond(null, null, null, null, null, null, null, null, null, null, null, false, null)))
                .hasSize(2);
    }

    @Test
    void 희망직종_지역_필터() {
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, "서울특별시", "강남구", null, null);
        seeker(EmploymentStatus.SEEKING, JobType.HOUSEKEEPER, null, "서울특별시", "강남구", null, null);
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, "부산광역시", "해운대구", null, null);

        assertThat(search(cond(JobType.CAREGIVER, null, null, null, null, null, null, null, null, null, null, null, null)))
                .hasSize(2);
        assertThat(search(cond(JobType.CAREGIVER, null, "서울특별시", "강남구", null, null, null, null, null, null, null, null, null)))
                .hasSize(1);
        assertThat(search(cond(null, null, null, "강남구", null, null, null, null, null, null, null, null, null)))
                .hasSize(2);
    }

    @Test
    void 희망지역_다중_필터() {
        seekerWithRegions(new DesiredRegion("서울특별시", "강남구"), new DesiredRegion("경기도", "성남시 분당구"));
        seekerWithRegions(new DesiredRegion("서울특별시", "송파구"));
        seekerWithRegions(new DesiredRegion("서울특별시", null)); // 시/도 전체
        seekerWithRegions(new DesiredRegion("부산광역시", "해운대구"));
        em.flush();

        // 희망지역에 "서울특별시" 를 포함한 인재 = 3
        assertThat(search(cond(null, null, "서울특별시", null, null, null, null, null, null, null, null, null, null)))
                .hasSize(3);
        // "서울특별시 강남구" 를 정확히 포함한 인재 = 1
        assertThat(search(cond(null, null, "서울특별시", "강남구", null, null, null, null, null, null, null, null, null)))
                .hasSize(1);
        // "경기도 성남시 분당구" 를 포함한 인재 = 1 (다중 희망지역 중 하나로 매칭)
        assertThat(search(cond(null, null, "경기도", "성남시 분당구", null, null, null, null, null, null, null, null, null)))
                .hasSize(1);
    }

    @Test
    void 희망_근무시간대_다중_필터() {
        seekerWithSchedule(WorkSchedule.DAY);
        seekerWithSchedule(WorkSchedule.NIGHT);
        seekerWithSchedule(WorkSchedule.MORNING);
        seeker(EmploymentStatus.SEEKING, JobType.CAREGIVER, null, null, null, null, null); // 시간대 미설정 → 제외
        em.flush();

        assertThat(search(condWs(List.of(WorkSchedule.DAY, WorkSchedule.NIGHT)))).hasSize(2);
        assertThat(search(condWs(List.of(WorkSchedule.MORNING)))).hasSize(1);
    }

    @Test
    void 희망급여_상한_필터() {
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.HOURLY, 12_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.HOURLY, 15_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.MONTHLY, 2_500_000);

        assertThat(search(cond(null, null, null, null, List.of(PayType.HOURLY), 13_500, null, null, null, null, null, null, null)))
                .hasSize(1);
    }

    @Test
    void 희망급여유형_다중_필터() {
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.HOURLY, 12_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.DAILY, 120_000);
        seeker(EmploymentStatus.SEEKING, null, null, null, null, PayType.MONTHLY, 2_500_000);
        em.flush();

        assertThat(search(cond(null, null, null, null, List.of(PayType.HOURLY, PayType.MONTHLY),
                null, null, null, null, null, null, null, null))).hasSize(2);
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

        assertThat(search(cond(null, null, null, null, null, null, null, null, null, null, null, null, 30)))
                .hasSize(1);
    }

    @Test
    void 성별_필터() {
        details(persist(EmploymentStatus.SEEKING), Gender.FEMALE, 5, null, null);
        details(persist(EmploymentStatus.SEEKING), Gender.MALE, 1, null, null);
        details(persist(EmploymentStatus.SEEKING), Gender.FEMALE, 0, null, null);
        em.flush();

        assertThat(search(cond(null, null, null, null, null, null, Gender.FEMALE, null, null, null, null, null, null)))
                .hasSize(2);
    }

    @Test
    void 경력구간_다중_필터() {
        details(persist(EmploymentStatus.SEEKING), null, 0, null, null);   // 신입
        details(persist(EmploymentStatus.SEEKING), null, 2, null, null);   // 1~3
        details(persist(EmploymentStatus.SEEKING), null, 4, null, null);   // 3~5
        details(persist(EmploymentStatus.SEEKING), null, 8, null, null);   // 5+
        details(persist(EmploymentStatus.SEEKING), null, null, null, null); // 경력 미입력
        em.flush();

        assertThat(career(CareerBucket.ENTRY)).hasSize(1);
        assertThat(career(CareerBucket.Y1_3)).hasSize(1);
        assertThat(career(CareerBucket.Y3_5)).hasSize(1);
        assertThat(career(CareerBucket.Y5_PLUS)).hasSize(1);
        // 3~5년 + 5년 이상 → 경력 4, 8 두 명
        assertThat(career(CareerBucket.Y3_5, CareerBucket.Y5_PLUS)).hasSize(2);
        // 경력 미입력 프로필은 어떤 구간에도 안 걸린다
        assertThat(career(CareerBucket.ENTRY, CareerBucket.Y1_3, CareerBucket.Y3_5, CareerBucket.Y5_PLUS))
                .hasSize(4);
    }

    private List<JobSeekerProfile> career(CareerBucket... buckets) {
        return search(cond(null, null, null, null, null, null, null, List.of(buckets),
                null, null, null, null, null));
    }

    @Test
    void 자격증_다중_필터_보유하면_매칭() {
        JobSeekerProfile a = persist(EmploymentStatus.SEEKING);
        certificate(a, "요양보호사 1급");
        certificate(a, "치매전문교육 이수");
        JobSeekerProfile b = persist(EmploymentStatus.SEEKING);
        certificate(b, "간호조무사");
        persist(EmploymentStatus.SEEKING); // 자격증 없음
        em.flush();
        em.clear();

        assertThat(search(cond(null, null, null, null, null, null, null, null, null, null,
                List.of("요양보호사 1급"), null, null))).hasSize(1);
        // 하나라도 보유하면 매칭
        assertThat(search(cond(null, null, null, null, null, null, null, null, null, null,
                List.of("요양보호사 1급", "간호조무사"), null, null))).hasSize(2);
        assertThat(search(cond(null, null, null, null, null, null, null, null, null, null,
                List.of("사회복지사 2급"), null, null))).isEmpty();
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
                List.of(CareTask.MEAL_SUPPORT, CareTask.MOBILITY_SUPPORT), null, null, null, null))).hasSize(2);
        // BATH_SUPPORT 가능 → 1명
        assertThat(search(cond(null, null, null, null, null, null, null, null,
                List.of(CareTask.BATH_SUPPORT), null, null, null, null))).hasSize(1);
        // PART_TIME 희망 → 1명
        assertThat(search(cond(null, null, null, null, null, null, null, null, null,
                List.of(EmploymentType.PART_TIME), null, null, null))).hasSize(1);
    }
}
