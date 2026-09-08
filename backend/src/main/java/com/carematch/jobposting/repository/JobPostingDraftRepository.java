package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.JobPostingDraft;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobPostingDraftRepository extends JpaRepository<JobPostingDraft, Long> {

    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    Optional<JobPostingDraft> findWithFacilityById(Long id);

    List<JobPostingDraft> findByFacilityProfileMemberIdOrderByUpdatedAtDesc(Long memberId);

    long countByFacilityProfileMemberId(Long memberId);
}
