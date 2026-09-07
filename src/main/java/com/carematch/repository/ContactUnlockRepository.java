package com.carematch.repository;


import com.carematch.entity.ContactUnlock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactUnlockRepository extends JpaRepository<ContactUnlock, Long> {
    boolean existsByEmployer_IdAndJobSeeker_Id(Long employerId, Long jobSeekerId);
}
