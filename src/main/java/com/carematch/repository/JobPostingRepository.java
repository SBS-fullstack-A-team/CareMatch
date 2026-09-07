package com.carematch.repository;


import com.carematch.entity.JobPosting;
import com.carematch.entity.JobPostingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 단건 CRUD 전용 (JPA). 다중조건 목록 검색은 MyBatis(mapper/JobPostingMapper)가 담당한다.
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByMember_IdAndStatus(Long memberId, JobPostingStatus status);
}
