package com.carematch.member.repository;

import com.carematch.member.domain.FacilityApprovalStatus;
import com.carematch.member.domain.FacilityProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FacilityProfileRepository extends JpaRepository<FacilityProfile, Long> {

    Optional<FacilityProfile> findByMemberId(Long memberId);

    boolean existsByBusinessRegistrationNumber(String businessRegistrationNumber);

    Page<FacilityProfile> findByApprovalStatus(FacilityApprovalStatus status, Pageable pageable);
}
