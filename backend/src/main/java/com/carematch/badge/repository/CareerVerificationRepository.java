package com.carematch.badge.repository;

import com.carematch.badge.domain.CareerVerification;
import com.carematch.badge.domain.CareerVerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CareerVerificationRepository extends JpaRepository<CareerVerification, Long> {

    List<CareerVerification> findByJobSeekerProfileId(Long jobSeekerProfileId);

    boolean existsByJobSeekerProfileIdAndStatus(Long jobSeekerProfileId, CareerVerificationStatus status);

    @EntityGraph(attributePaths = {"jobSeekerProfile", "jobSeekerProfile.member"})
    Page<CareerVerification> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"jobSeekerProfile", "jobSeekerProfile.member"})
    Page<CareerVerification> findByStatus(CareerVerificationStatus status, Pageable pageable);
}
