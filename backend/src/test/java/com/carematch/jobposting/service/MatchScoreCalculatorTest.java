package com.carematch.jobposting.service;

import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MatchScoreCalculatorTest {

    private final MatchScoreCalculator calculator = new MatchScoreCalculator();

    private JobSeekerProfile seeker(JobType jobType, WorkType workType, String sido, String sigungu,
                                    PayType payType, Integer minPay) {
        JobSeekerProfile p = JobSeekerProfile.builder()
                .employmentStatus(EmploymentStatus.SEEKING)
                .build();
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                jobType, workType, sido, sigungu, payType, minPay));
        return p;
    }

    private JobPosting posting(JobType jobType, WorkType workType, String sido, String sigungu,
                               PayType payType, Integer payAmount) {
        return JobPosting.builder()
                .jobType(jobType)
                .workType(workType)
                .sido(sido)
                .sigungu(sigungu)
                .payType(payType)
                .payAmount(payAmount)
                .build();
    }

    @Test
    void 희망조건_미설정이면_null() {
        JobSeekerProfile empty = JobSeekerProfile.builder().employmentStatus(EmploymentStatus.SEEKING).build();
        assertThat(calculator.score(empty, posting(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000)))
                .isNull();
    }

    @Test
    void 구직자_null이면_null() {
        assertThat(calculator.score(null, posting(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000)))
                .isNull();
    }

    @Test
    void 모든_조건_완벽_일치면_100() {
        JobSeekerProfile s = seeker(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 2_500_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(100);
    }

    @Test
    void 직종만_지정_불일치면_0() {
        JobSeekerProfile s = seeker(JobType.HOUSEKEEPER, null, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(0);
    }

    @Test
    void 직종_지역만_지정_직종만_맞으면_가중치비율() {
        // 지정: 직종(35) + 지역(30). 직종 일치, 지역 완전 불일치 → 35 / 65 ≈ 54
        JobSeekerProfile s = seeker(JobType.CAREGIVER, null, "서울특별시", "강남구", null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, "부산광역시", "해운대구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(54);
    }

    @Test
    void 시도만_일치하면_지역_절반점수() {
        // 지정: 지역(30)만. 시/도 일치, 시/군/구 불일치 → 15 / 30 = 50
        JobSeekerProfile s = seeker(null, null, "서울특별시", "강남구", null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "송파구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(50);
    }

    @Test
    void 협의_근무형태는_일치로_처리() {
        JobSeekerProfile s = seeker(null, WorkType.LIVE_IN, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.NEGOTIABLE, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(100);
    }

    @Test
    void 급여_미달이면_비율점수() {
        // 지정: 급여(15)만. 희망 300만, 공고 240만 → 0.8 → 12 / 15 = 80
        JobSeekerProfile s = seeker(null, null, null, null, PayType.MONTHLY, 3_000_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 2_400_000);
        assertThat(calculator.score(s, p)).isEqualTo(80);
    }

    @Test
    void 급여유형_다르면_급여점수_0() {
        JobSeekerProfile s = seeker(null, null, null, null, PayType.HOURLY, 12_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(0);
    }
}
