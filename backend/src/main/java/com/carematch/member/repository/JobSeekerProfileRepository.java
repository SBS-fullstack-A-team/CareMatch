package com.carematch.member.repository;

import com.carematch.member.domain.JobSeekerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface JobSeekerProfileRepository
        extends JpaRepository<JobSeekerProfile, Long>, JpaSpecificationExecutor<JobSeekerProfile> {

    @Query("""
            select distinct p from JobSeekerProfile p
            join fetch p.member
            left join fetch p.certificates
            where p.id = :id
            """)
    Optional<JobSeekerProfile> findWithDetailsById(@Param("id") Long id);

    Optional<JobSeekerProfile> findByMemberId(Long memberId);
}
