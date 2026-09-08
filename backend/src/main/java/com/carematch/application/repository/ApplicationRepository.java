package com.carematch.application.repository;

import com.carematch.application.domain.Application;
import com.carematch.application.domain.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByJobPostingIdAndJobSeekerProfileId(Long jobPostingId, Long jobSeekerProfileId);

    @EntityGraph(attributePaths = {
            "jobPosting", "jobPosting.facilityProfile", "jobPosting.facilityProfile.member",
            "jobSeekerProfile", "jobSeekerProfile.member"})
    Optional<Application> findWithDetailsById(Long id);

    /** 특정 공고의 지원자 목록 (status null 이면 전체). 최신 지원순. */
    @EntityGraph(attributePaths = {"jobSeekerProfile", "jobSeekerProfile.member"})
    @Query("""
            select a from Application a
            where a.jobPosting.id = :jobPostingId
              and (:status is null or a.status = :status)
            order by a.createdAt desc
            """)
    Page<Application> findApplicantsOfPosting(@Param("jobPostingId") Long jobPostingId,
                                              @Param("status") ApplicationStatus status,
                                              Pageable pageable);

    /** 내 지원 목록 (status null 이면 전체). 최신 지원순. */
    @EntityGraph(attributePaths = {
            "jobPosting", "jobPosting.facilityProfile", "jobPosting.facilityProfile.member"})
    @Query("""
            select a from Application a
            where a.jobSeekerProfile.member.id = :memberId
              and (:status is null or a.status = :status)
            order by a.createdAt desc
            """)
    Page<Application> findMyApplications(@Param("memberId") Long memberId,
                                        @Param("status") ApplicationStatus status,
                                        Pageable pageable);
}
