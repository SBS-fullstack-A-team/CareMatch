package com.carematch.jobposting.repository;

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
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JobPostingNearbyTest {

    @Autowired
    private JobPostingRepository repository;
    @Autowired
    private EntityManager em;

    private FacilityProfile facility;
    private int seq = 0;

    @BeforeEach
    void setUp() {
        seq++;
        Member m = Member.builder()
                .loginId("nf" + seq).password("x").email("nf" + seq + "@t.com").name("F").phone("010-0000-0000")
                .role(Role.FACILITY).verified(true).build();
        em.persist(m);
        facility = FacilityProfile.builder()
                .member(m).facilityName("F").businessRegistrationNumber("123-45-67890").build();
        em.persist(facility);
    }

    private JobPosting posting(String title, Double lat, Double lng, boolean open) {
        JobPosting jp = JobPosting.builder()
                .facilityProfile(facility).title(title).jobType(JobType.CAREGIVER)
                .workType(WorkType.COMMUTE).employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(PayType.MONTHLY).payAmount(3_000_000).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Jung")
                .latitude(lat).longitude(lng)
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL).build();
        em.persist(jp);
        if (!open) {
            jp.close();
        }
        return jp;
    }

    @Test
    void 바운딩박스_OPEN_좌표있음_만_반환() {
        posting("inside", 37.5665, 126.9780, true);       // 서울시청
        posting("far", 35.1796, 129.0756, true);          // 부산 (박스 밖)
        posting("no-coords", null, null, true);
        posting("closed inside", 37.5670, 126.9785, false);
        em.flush();
        em.clear();

        // 서울시청 주변 ±0.05도
        var list = repository.findOpenWithinBoundingBox(37.516, 37.616, 126.928, 127.028, PageRequest.of(0, 100));

        assertThat(list).extracting(JobPosting::getTitle).containsExactly("inside");
    }

    @Test
    void 모서리가_뒤바뀌면_between_이_비어_결과없음_서비스가_정규화해야_한다() {
        posting("inside", 37.5665, 126.9780, true);
        em.flush();
        em.clear();

        // min/max 를 뒤집어 전달 → SQL between 은 아무것도 못 잡는다 (mapView 가 min/max 보정하는 이유)
        var swapped = repository.findOpenWithinBoundingBox(37.616, 37.516, 127.028, 126.928, PageRequest.of(0, 100));
        assertThat(swapped).isEmpty();

        var normalized = repository.findOpenWithinBoundingBox(37.516, 37.616, 126.928, 127.028, PageRequest.of(0, 100));
        assertThat(normalized).extracting(JobPosting::getTitle).containsExactly("inside");
    }

    @Test
    void 결과가_상한을_넘으면_Pageable_로_잘린다() {
        for (int i = 0; i < 5; i++) {
            posting("p" + i, 37.560 + i * 0.001, 126.977, true);
        }
        em.flush();
        em.clear();

        var capped = repository.findOpenWithinBoundingBox(37.5, 37.7, 126.9, 127.1, PageRequest.of(0, 3));
        assertThat(capped).hasSize(3);
    }
}
