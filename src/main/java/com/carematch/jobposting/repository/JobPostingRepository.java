package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 구인공고 CRUD + 목록/검색.
 * 다중조건 동적 검색은 JpaSpecificationExecutor + JobPostingSpecs 로 처리(추가 의존성 없이 Spring Data 범위).
 */
public interface JobPostingRepository
        extends JpaRepository<JobPosting, Long>, JpaSpecificationExecutor<JobPosting> {

    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    Optional<JobPosting> findWithFacilityById(Long id);

    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    Page<JobPosting> findByStatus(JobPostingStatus status, Pageable pageable);

    /** "소페셜 채용정보" 상단 노출용 — 만료 안 된 SPECIAL 공고 상위 N. */
    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    List<JobPosting> findTop3ByStatusAndExposureTypeAndExposureExpiredAtAfterOrderByCreatedAtDesc(
            JobPostingStatus status, ExposureType exposureType, LocalDateTime now);
}
