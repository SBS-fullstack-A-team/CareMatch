package com.carematch.member.service;

import com.carematch.jobposting.domain.JobType;
import com.carematch.member.domain.DesiredRegion;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.TalentSearchDtos.FacetsResponse;
import com.carematch.member.dto.TalentSearchDtos.SearchCondition;
import com.carematch.member.repository.JobSeekerProfileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@code GET /api/jobseekers/facets} 의 핵심 규칙: 축은 자기 자신의 선택은 제외하고 세고,
 * 다른 축의 선택은 그대로 적용한다 (JobPostingFacetsTest 와 동일 규칙).
 */
@DataJpaTest
class TalentSearchFacetsTest {

    @Autowired
    private JobSeekerProfileRepository jobSeekerProfileRepository;

    @Autowired
    private EntityManager em;

    private TalentSearchService service;
    private int seq = 0;

    @BeforeEach
    void setUp() {
        service = new TalentSearchService(jobSeekerProfileRepository, null, null, em);

        seeker(JobType.CAREGIVER, "서울특별시", "강남구");
        seeker(JobType.CARE_ATTENDANT, "서울특별시", "서초구");
        seeker(JobType.CARE_ATTENDANT, "부산광역시", "해운대구");
        em.flush();
        em.clear();
    }

    private void seeker(JobType jobType, String sido, String sigungu) {
        seq++;
        Member m = Member.builder()
                .loginId("talent-facet-" + seq).password("x").email("tf" + seq + "@t.com")
                .name("S" + seq).phone("010-4444-000" + seq).role(Role.JOBSEEKER).verified(true).build();
        em.persist(m);
        JobSeekerProfile p = JobSeekerProfile.builder().member(m).employmentStatus(EmploymentStatus.SEEKING).build();
        em.persist(p);
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                jobType, null, null, List.of(new DesiredRegion(sido, sigungu)), null, null));
    }

    private SearchCondition withJobType(JobType jobType) {
        return new SearchCondition(List.of(jobType), null, null, null, null, null, null, null, null, null,
                null, null, null, null, null);
    }

    @Test
    void 축은_자기_선택을_제외하고_전체를_센다() {
        FacetsResponse facets = service.facets(withJobType(JobType.CAREGIVER));

        assertThat(facets.desiredJobType())
                .containsEntry("CAREGIVER", 1L)
                .containsEntry("CARE_ATTENDANT", 2L);
    }

    @Test
    void 다른_축의_선택은_그대로_적용된다() {
        FacetsResponse facets = service.facets(withJobType(JobType.CARE_ATTENDANT));

        // desiredJobType=CARE_ATTENDANT 필터가 sido facet 에는 그대로 적용돼 서울/부산 1명씩만 남는다.
        assertThat(facets.sido())
                .containsEntry("서울특별시", 1L)
                .containsEntry("부산광역시", 1L);
    }
}
