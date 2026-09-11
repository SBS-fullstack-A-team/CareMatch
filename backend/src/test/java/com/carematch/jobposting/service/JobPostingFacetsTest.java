package com.carematch.jobposting.service;

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
import com.carematch.jobposting.dto.JobPostingDtos.FacetsResponse;
import com.carematch.jobposting.dto.JobPostingDtos.SearchCondition;
import com.carematch.jobposting.repository.JobPostingRepository;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.FacilityType;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@code GET /api/job-postings/facets} 의 핵심 규칙 두 가지를 검증한다:
 * 1) 각 축은 자기 자신의 선택은 제외하고 센다 (jobTypes 필터를 걸어도 jobType facet 은 전체를 보여준다)
 * 2) 다른 축의 선택은 그대로 적용한다 (jobTypes 필터가 facilityType facet 에는 반영된다)
 *
 * {@link JobPostingService} 는 {@code @RequiredArgsConstructor} 라 facets() 이 쓰지 않는
 * 협력 객체(포인트·매칭 등)는 null 로 넘겨도 안전하다.
 */
@DataJpaTest
class JobPostingFacetsTest {

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private EntityManager em;

    private JobPostingService service;

    @BeforeEach
    void setUp() {
        service = new JobPostingService(
                jobPostingRepository, null, null, null, null, null, null, em);

        posting(JobType.CAREGIVER, FacilityType.NURSING_HOME);
        posting(JobType.CARE_ATTENDANT, FacilityType.NURSING_HOME);
        posting(JobType.CARE_ATTENDANT, FacilityType.VISITING_CARE);
        em.flush();
        em.clear();
    }

    private int seq = 0;

    private void posting(JobType jobType, FacilityType facilityType) {
        seq++;
        Member member = Member.builder()
                .loginId("fac-facets-" + seq).password("x").email("facets" + seq + "@t.com")
                .name("F").phone("010-2222-000" + seq).role(Role.FACILITY).verified(true).build();
        em.persist(member);
        FacilityProfile fp = FacilityProfile.builder()
                .member(member).facilityName("시설" + seq).facilityType(facilityType)
                .businessRegistrationNumber("222-22-2222" + seq).build();
        em.persist(fp);
        em.persist(JobPosting.builder()
                .facilityProfile(fp)
                .title("공고" + seq).jobType(jobType)
                .workType(WorkType.COMMUTE).employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(PayType.MONTHLY).payAmount(3_000_000).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Gangnam")
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL).exposureType(ExposureType.NORMAL).build());
    }

    private SearchCondition conditionWithJobTypes(List<JobType> jobTypes) {
        return new SearchCondition(null, null, jobTypes, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void 축은_자기_선택을_제외하고_전체를_센다() {
        FacetsResponse facets = service.facets(conditionWithJobTypes(List.of(JobType.CAREGIVER)));

        assertThat(facets.jobType())
                .containsEntry("CAREGIVER", 1L)
                .containsEntry("CARE_ATTENDANT", 2L);
    }

    @Test
    void 다른_축의_선택은_그대로_적용된다() {
        FacetsResponse facets = service.facets(conditionWithJobTypes(List.of(JobType.CAREGIVER)));

        // jobTypes=[CAREGIVER] 필터가 facilityType facet 에는 그대로 적용돼 NURSING_HOME 1건만 남는다.
        assertThat(facets.facilityType()).containsExactly(java.util.Map.entry("NURSING_HOME", 1L));
    }

    @Test
    void 필터가_없으면_전체_기준으로_센다() {
        FacetsResponse facets = service.facets(conditionWithJobTypes(null));

        assertThat(facets.jobType()).containsEntry("CAREGIVER", 1L).containsEntry("CARE_ATTENDANT", 2L);
        assertThat(facets.facilityType())
                .containsEntry("NURSING_HOME", 2L)
                .containsEntry("VISITING_CARE", 1L);
        assertThat(facets.payType()).containsEntry("MONTHLY", 3L);
    }
}
