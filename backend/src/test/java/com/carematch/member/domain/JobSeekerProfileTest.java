package com.carematch.member.domain;

import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JobSeekerProfileTest {

    private JobSeekerProfile newProfile() {
        return JobSeekerProfile.builder()
                .employmentStatus(EmploymentStatus.SEEKING)
                .residence("서울특별시 강남구 역삼동")
                .build();
    }

    @Test
    void 희망근무조건_수정_저장된다() {
        JobSeekerProfile profile = newProfile();

        profile.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 2_500_000));

        assertThat(profile.getDesiredJobType()).isEqualTo(JobType.CAREGIVER);
        assertThat(profile.getDesiredWorkType()).isEqualTo(WorkType.COMMUTE);
        assertThat(profile.getDesiredSido()).isEqualTo("서울특별시");
        assertThat(profile.getDesiredSigungu()).isEqualTo("강남구");
        assertThat(profile.getDesiredPayType()).isEqualTo(PayType.MONTHLY);
        assertThat(profile.getDesiredMinPay()).isEqualTo(2_500_000);
    }

    @Test
    void 희망근무조건_일부_null_이면_조건없음으로_덮어쓴다() {
        JobSeekerProfile profile = newProfile();
        profile.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                JobType.CAREGIVER, WorkType.COMMUTE, "서울특별시", "강남구", PayType.MONTHLY, 2_500_000));

        profile.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                JobType.HOUSEKEEPER, null, null, null, null, null));

        assertThat(profile.getDesiredJobType()).isEqualTo(JobType.HOUSEKEEPER);
        assertThat(profile.getDesiredWorkType()).isNull();
        assertThat(profile.getDesiredSido()).isNull();
        assertThat(profile.getDesiredMinPay()).isNull();
    }

    @Test
    void updateProfile_는_희망조건을_건드리지_않는다() {
        JobSeekerProfile profile = newProfile();
        profile.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                JobType.CAREGIVER, null, null, null, null, null));

        profile.updateProfile("경기도 성남시 분당구", "안녕하세요");

        assertThat(profile.getResidence()).isEqualTo("경기도 성남시 분당구");
        assertThat(profile.getIntroduction()).isEqualTo("안녕하세요");
        assertThat(profile.getDesiredJobType()).isEqualTo(JobType.CAREGIVER);
    }
}
