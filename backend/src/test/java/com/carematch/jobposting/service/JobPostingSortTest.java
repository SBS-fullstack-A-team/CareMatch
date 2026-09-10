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
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JobPostingSortTest {

    private JobPosting posting(String title, ExposureType exposure) {
        return JobPosting.builder()
                .title(title).jobType(JobType.CAREGIVER)
                .workType(WorkType.COMMUTE).employmentType(EmploymentType.CONTRACT)
                .workDays("Mon-Fri").workStartTime(LocalTime.of(9, 0)).workEndTime(LocalTime.of(12, 0))
                .payType(PayType.MONTHLY).payAmount(3_000_000).recruitCount(1).deadline(LocalDate.now().plusDays(30))
                .sido("Seoul").sigungu("Jung")
                .careGrade(CareGrade.GRADE_4).elderGender(ElderGender.FEMALE)
                .mobilityStatus(MobilityStatus.INDEPENDENT).mealStatus(MealStatus.ASSIST)
                .cognitiveStatus(CognitiveStatus.NORMAL)
                .exposureType(exposure).build();
    }

    @Test
    void 노출등급_우선_같은등급이면_매칭점수() {
        JobPosting a = posting("A special, score 50", ExposureType.SPECIAL);
        JobPosting b = posting("B normal, score 90", ExposureType.NORMAL);
        JobPosting c = posting("C special, score 90", ExposureType.SPECIAL);
        Map<JobPosting, Integer> score = Map.of(a, 50, b, 90, c, 90);

        List<JobPosting> sorted = List.of(a, b, c).stream()
                .sorted(JobPostingService.byExposureThenMatch(jp -> score.get(jp)))
                .toList();

        // 유료 노출(SPECIAL)이 먼저, 그 안에서 매칭점수 순. NORMAL 은 점수 90 이어도 맨 뒤.
        assertThat(sorted).extracting(JobPosting::getTitle)
                .containsExactly("C special, score 90", "A special, score 50", "B normal, score 90");
    }

    @Test
    void 같은등급_내에서_미채점은_맨_뒤() {
        JobPosting scored = posting("scored", ExposureType.NORMAL);
        JobPosting unscored = posting("unscored", ExposureType.NORMAL);

        List<JobPosting> sorted = List.of(unscored, scored).stream()
                .sorted(JobPostingService.byExposureThenMatch(
                        jp -> jp == scored ? 10 : Integer.MIN_VALUE))
                .toList();

        assertThat(sorted).extracting(JobPosting::getTitle).containsExactly("scored", "unscored");
    }

    @Test
    void resolveSort_PAY_ASC_는_급여_오름차순() {
        assertThat(JobPostingService.resolveSort("PAY_ASC"))
                .containsExactly(new Sort.Order(Sort.Direction.ASC, "payAmount"));
    }

    @Test
    void resolveSort_PAY_DESC_는_급여_내림차순() {
        assertThat(JobPostingService.resolveSort("PAY_DESC"))
                .containsExactly(new Sort.Order(Sort.Direction.DESC, "payAmount"));
    }

    @Test
    void resolveSort_알수없는_값이면_추천정렬_노출등급_최신순() {
        assertThat(JobPostingService.resolveSort("RECOMMENDED"))
                .containsExactly(new Sort.Order(Sort.Direction.DESC, "exposurePriority"),
                        new Sort.Order(Sort.Direction.DESC, "createdAt"));
    }
}
