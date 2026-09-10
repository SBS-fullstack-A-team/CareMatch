package com.carematch.application.repository;

import com.carematch.application.domain.Application;
import com.carematch.application.domain.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByJobPostingIdAndJobSeekerProfileId(Long jobPostingId, Long jobSeekerProfileId);

    /** 공고별 지원자 수 (취소 제외). 목록/상세 응답의 "지원 N명" 용. 결과에 0건 공고는 안 나온다. */
    @Query("""
            select a.jobPosting.id as postingId, count(a) as count
            from Application a
            where a.jobPosting.id in :jobPostingIds
              and a.status <> com.carematch.application.domain.ApplicationStatus.CANCELED
            group by a.jobPosting.id
            """)
    List<PostingApplicantCount> countByJobPostingIdIn(@Param("jobPostingIds") Collection<Long> jobPostingIds);

    interface PostingApplicantCount {
        Long getPostingId();

        long getCount();
    }

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
