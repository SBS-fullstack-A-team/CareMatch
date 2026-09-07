package com.carematch.repository;


import com.carematch.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobPosting_IdAndApplicant_Id(Long jobPostingId, Long applicantId);
    List<Application> findByApplicant_Id(Long applicantId);
    List<Application> findByJobPosting_Id(Long jobPostingId);
}
