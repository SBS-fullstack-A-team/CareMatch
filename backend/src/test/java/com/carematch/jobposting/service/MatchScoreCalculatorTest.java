package com.carematch.jobposting.service;

import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.jobposting.dto.JobPostingDtos.MatchReason;
import com.carematch.member.domain.DesiredRegion;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

class MatchScoreCalculatorTest {

    private final MatchScoreCalculator calculator = new MatchScoreCalculator();

    private JobSeekerProfile seeker(JobType jobType, WorkType workType, WorkSchedule workSchedule,
                                    String sido, String sigungu, PayType payType, Integer minPay) {
        JobSeekerProfile p = JobSeekerProfile.builder()
                .employmentStatus(EmploymentStatus.SEEKING)
                .build();
        List<DesiredRegion> regions = sido == null ? List.of() : List.of(new DesiredRegion(sido, sigungu));
        p.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                jobType, workType, workSchedule, regions, payType, minPay));
        return p;
    }

    private JobPosting posting(JobType jobType, WorkType workType, WorkSchedule workSchedule,
                               String sido, String sigungu, PayType payType, Integer payAmount) {
        return JobPosting.builder()
                .jobType(jobType)
                .workType(workType)
                .workSchedule(workSchedule)
                .sido(sido)
                .sigungu(sigungu)
                .payType(payType)
                .payAmount(payAmount)
                .build();
    }

    @Test
    void 희망조건_미설정이면_null() {
        JobSeekerProfile empty = JobSeekerProfile.builder().employmentStatus(EmploymentStatus.SEEKING).build();
        assertThat(calculator.score(empty, posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000)))
                .isNull();
    }

    @Test
    void 구직자_null이면_null() {
        assertThat(calculator.score(null, posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000)))
                .isNull();
    }

    @Test
    void 모든_조건_완벽_일치면_100() {
        JobSeekerProfile s = seeker(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 2_500_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(100);
    }

    @Test
    void 직종만_지정_불일치면_0() {
        JobSeekerProfile s = seeker(JobType.HOUSEKEEPER, null, null, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(0);
    }

    @Test
    void 직종_지역만_지정_직종만_맞으면_가중치비율() {
        // 지정: 직종(35) + 지역(30). 직종 일치, 지역 완전 불일치 → 35 / 65 ≈ 54
        JobSeekerProfile s = seeker(JobType.CAREGIVER, null, null, "서울특별시", "강남구", null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "부산광역시", "해운대구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(54);
    }

    @Test
    void 시도만_일치하면_지역_절반점수() {
        // 지정: 지역(30)만. 시/도 일치, 시/군/구 불일치 → 15 / 30 = 50
        JobSeekerProfile s = seeker(null, null, null, "서울특별시", "강남구", null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "송파구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(50);
    }

    @Test
    void 희망지역_여러개면_가장_잘_맞는_지역_기준() {
        // 희망: 부산 해운대구 + 서울 송파구. 공고는 서울 송파구 → 완전 일치 1.0 → 지역 만점
        JobSeekerProfile s = JobSeekerProfile.builder().employmentStatus(EmploymentStatus.SEEKING).build();
        s.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                null, null, null,
                List.of(new DesiredRegion("부산광역시", "해운대구"), new DesiredRegion("서울특별시", "송파구")),
                null, null));
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "송파구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(100);
    }

    @Test
    void 협의_근무형태는_일치로_처리() {
        JobSeekerProfile s = seeker(null, WorkType.LIVE_IN, null, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.NEGOTIABLE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(100);
    }

    @Test
    void 근무_시간대만_지정_일치면_100() {
        JobSeekerProfile s = seeker(null, null, WorkSchedule.NIGHT, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.NIGHT, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(100);
    }

    @Test
    void 근무_시간대_불일치면_0() {
        JobSeekerProfile s = seeker(null, null, WorkSchedule.NIGHT, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(0);
    }

    @Test
    void 공고에_시간대가_없으면_시간대축은_채점에서_제외() {
        // 지정: 직종(35) + 시간대(10). 공고에 workSchedule 없음 → 시간대 축 분모 제외.
        // 직종만 일치 → 35 / 35 = 100
        JobSeekerProfile s = seeker(JobType.CAREGIVER, null, WorkSchedule.DAY, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.LIVE_IN, null, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(100);
    }

    @Test
    void 근무형태와_시간대_각_10점() {
        // 지정: 근무형태(10) + 시간대(10). 근무형태 일치, 시간대 불일치 → 10 / 20 = 50
        JobSeekerProfile s = seeker(null, WorkType.COMMUTE, WorkSchedule.MORNING, null, null, null, null);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.NIGHT, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(50);
    }

    @Test
    void 급여_미달이면_비율점수() {
        // 지정: 급여(15)만. 희망 300만, 공고 240만 → 0.8 → 12 / 15 = 80
        JobSeekerProfile s = seeker(null, null, null, null, null, PayType.MONTHLY, 3_000_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 2_400_000);
        assertThat(calculator.score(s, p)).isEqualTo(80);
    }

    @Test
    void 급여유형_다르면_급여점수_0() {
        JobSeekerProfile s = seeker(null, null, null, null, null, PayType.HOURLY, 12_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        assertThat(calculator.score(s, p)).isEqualTo(0);
    }

    @Test
    void 채점_불가면_사유도_빈리스트() {
        JobSeekerProfile empty = JobSeekerProfile.builder().employmentStatus(EmploymentStatus.SEEKING).build();
        MatchScoreCalculator.MatchResult r = calculator.evaluate(
                empty, posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000));
        assertThat(r.score()).isNull();
        assertThat(r.reasons()).isEmpty();
    }

    @Test
    void 사유는_지정한_축마다_충족여부와_함께_담긴다() {
        // 직종·시간대 일치, 지역은 시/도만 일치(미충족), 급여 미달(미충족). 근무형태 축은 사유 없음.
        JobSeekerProfile s = seeker(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "송파구", PayType.MONTHLY, 2_400_000);
        MatchScoreCalculator.MatchResult r = calculator.evaluate(s, p);
        assertThat(r.reasons())
                .extracting(MatchReason::kind, MatchReason::matched)
                .containsExactly(
                        tuple("category", true),
                        tuple("region", false),
                        tuple("schedule", true),
                        tuple("pay", false));
        assertThat(r.reasons()).filteredOn(mr -> mr.kind().equals("region"))
                .singleElement().extracting(MatchReason::detail).isEqualTo("서울특별시 송파구");
    }

    @Test
    void 모두_충족이면_사유도_모두_matched() {
        JobSeekerProfile s = seeker(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 2_500_000);
        JobPosting p = posting(JobType.CAREGIVER, WorkType.COMMUTE, WorkSchedule.DAY, "서울특별시", "강남구", PayType.MONTHLY, 3_000_000);
        MatchScoreCalculator.MatchResult r = calculator.evaluate(s, p);
        assertThat(r.score()).isEqualTo(100);
        assertThat(r.reasons())
                .extracting(MatchReason::kind, MatchReason::matched)
                .containsExactly(
                        tuple("category", true),
                        tuple("region", true),
                        tuple("schedule", true),
                        tuple("pay", true));
    }
}
