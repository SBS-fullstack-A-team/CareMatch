package com.carematch.member.repository;

import com.carematch.member.domain.FacilityApprovalStatus;
import com.carematch.member.domain.FacilityProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FacilityProfileRepository extends JpaRepository<FacilityProfile, Long> {

    Optional<FacilityProfile> findByMemberId(Long memberId);

    boolean existsByBusinessRegistrationNumber(String businessRegistrationNumber);

    /** 관리자 시설관리 목록 — member 를 함께 fetch 해 N+1 을 피한다. */
    @EntityGraph(attributePaths = "member")
    Page<FacilityProfile> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "member")
    Page<FacilityProfile> findByApprovalStatus(FacilityApprovalStatus status, Pageable pageable);
}
