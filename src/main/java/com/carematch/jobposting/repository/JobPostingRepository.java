package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 구인공고 단건 CRUD + 단순 목록(JPA).
 * 다중조건 동적 검색은 다음 PR에서 별도 처리(팀 규칙: 동적 쿼리).
 */
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    Optional<JobPosting> findWithFacilityById(Long id);

    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    Page<JobPosting> findByStatus(JobPostingStatus status, Pageable pageable);
}
