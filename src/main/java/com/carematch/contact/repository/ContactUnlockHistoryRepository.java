package com.carematch.contact.repository;

import com.carematch.contact.domain.ContactUnlockHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContactUnlockHistoryRepository extends JpaRepository<ContactUnlockHistory, Long> {

    boolean existsByFacilityMemberIdAndJobSeekerProfileId(Long facilityMemberId, Long jobSeekerProfileId);

    Optional<ContactUnlockHistory> findByFacilityMemberIdAndJobSeekerProfileId(Long facilityMemberId, Long jobSeekerProfileId);
}
