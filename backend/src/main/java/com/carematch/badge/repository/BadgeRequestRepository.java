package com.carematch.badge.repository;

import com.carematch.badge.domain.BadgeRequest;
import com.carematch.badge.domain.BadgeRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRequestRepository extends JpaRepository<BadgeRequest, Long> {

    List<BadgeRequest> findByJobSeekerProfileIdOrderByRequestedAtDesc(Long jobSeekerProfileId);

    boolean existsByJobSeekerProfileIdAndStatus(Long jobSeekerProfileId, BadgeRequestStatus status);

    @EntityGraph(attributePaths = {"jobSeekerProfile", "jobSeekerProfile.member"})
    Page<BadgeRequest> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"jobSeekerProfile", "jobSeekerProfile.member"})
    Page<BadgeRequest> findByStatus(BadgeRequestStatus status, Pageable pageable);
}
