package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.JobPostingDraft;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.Role;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JobPostingDraftRepositoryTest {

    @Autowired
    private JobPostingDraftRepository repository;

    @Autowired
    private EntityManager em;

    private Long memberId;
    private FacilityProfile facility;

    @BeforeEach
    void setUp() {
        Member member = Member.builder()
                .loginId("draft-fac").password("x").email("d@test.com").name("D").phone("010-0000-0000")
                .role(Role.FACILITY).verified(true)
                .build();
        em.persist(member);
        memberId = member.getId();
        facility = FacilityProfile.builder()
                .member(member).facilityName("C").businessRegistrationNumber("123-45-67890")
                .build();
        em.persist(facility);
    }

    private JobPostingDraft draft(String title) {
        JobPostingDraft d = JobPostingDraft.builder()
                .facilityProfile(facility).title(title).formJson("{\"step\":1}")
                .build();
        em.persist(d);
        return d;
    }

    @Test
    void 내_임시저장은_updatedAt_내림차순() {
        JobPostingDraft first = draft("first");
        JobPostingDraft second = draft("second");
        em.flush();
        // first 를 나중에 수정 → 목록 맨 앞으로
        first.update("first-edited", "{\"step\":2}");
        em.flush();
        em.clear();

        var list = repository.findByFacilityProfileMemberIdOrderByUpdatedAtDesc(memberId);

        assertThat(list).extracting(JobPostingDraft::getTitle)
                .containsExactly("first-edited", "second");
    }

    @Test
    void 다른_시설의_임시저장은_안_보인다() {
        draft("mine");
        Member other = Member.builder()
                .loginId("other-fac").password("x").email("o@test.com").name("O").phone("010-1111-1111")
                .role(Role.FACILITY).verified(true).build();
        em.persist(other);
        FacilityProfile otherFacility = FacilityProfile.builder()
                .member(other).facilityName("O").businessRegistrationNumber("999-45-67890").build();
        em.persist(otherFacility);
        em.persist(JobPostingDraft.builder().facilityProfile(otherFacility).title("theirs").build());
        em.flush();
        em.clear();

        assertThat(repository.countByFacilityProfileMemberId(memberId)).isEqualTo(1);
        assertThat(repository.findByFacilityProfileMemberIdOrderByUpdatedAtDesc(memberId))
                .extracting(JobPostingDraft::getTitle).containsExactly("mine");
    }

    @Test
    void findWithFacilityById_는_시설_소유자를_함께_로드() {
        Long id = draft("x").getId();
        em.flush();
        em.clear();

        JobPostingDraft found = repository.findWithFacilityById(id).orElseThrow();
        assertThat(found.isOwnedBy(memberId)).isTrue();
        assertThat(found.isOwnedBy(memberId + 999)).isFalse();
    }
}
