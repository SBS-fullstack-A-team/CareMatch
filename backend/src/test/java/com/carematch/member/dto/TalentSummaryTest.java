package com.carematch.member.dto;

import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.TalentSearchDtos.TalentSummary;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TalentSummaryTest {

    private JobSeekerProfile profileOf(String name) {
        Member m = Member.builder()
                .loginId("seeker").password("x").email("s@t.com").name(name)
                .phone("010-1234-5678").role(Role.JOBSEEKER).verified(true).build();
        return JobSeekerProfile.builder().member(m).employmentStatus(EmploymentStatus.SEEKING).build();
    }

    @Test
    void 목록_이름은_항상_마스킹된다() {
        TalentSummary summary = TalentSummary.from(profileOf("홍길동"), List.of(), null);
        assertThat(summary.name()).isEqualTo("홍*동");
    }

    @Test
    void 두글자_이름_마스킹() {
        TalentSummary summary = TalentSummary.from(profileOf("김철"), List.of(), null);
        assertThat(summary.name()).isEqualTo("김*");
    }
}
