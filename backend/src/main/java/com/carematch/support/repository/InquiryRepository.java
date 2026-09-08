package com.carematch.support.repository;

import com.carematch.support.domain.Inquiry;
import com.carematch.support.domain.InquiryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    Page<Inquiry> findByMemberIdOrderByCreatedAtDesc(Long memberId, Pageable pageable);

    Page<Inquiry> findByStatusOrderByCreatedAtDesc(InquiryStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "replies")
    @Query("select i from Inquiry i where i.id = :id")
    Optional<Inquiry> findWithRepliesById(@Param("id") Long id);
}
