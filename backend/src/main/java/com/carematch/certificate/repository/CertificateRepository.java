package com.carematch.certificate.repository;

import com.carematch.certificate.domain.Certificate;
import com.carematch.certificate.domain.CertificateReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByJobSeekerProfileId(Long jobSeekerProfileId);

    List<Certificate> findByJobSeekerProfileIdIn(Collection<Long> jobSeekerProfileIds);

    boolean existsByJobSeekerProfileIdAndAdminReviewStatus(Long jobSeekerProfileId, CertificateReviewStatus adminReviewStatus);

    /** 관리자 심사 목록 — jobSeekerProfile.member 를 함께 fetch 해 N+1 을 피한다. */
    @EntityGraph(attributePaths = {"jobSeekerProfile", "jobSeekerProfile.member"})
    Page<Certificate> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"jobSeekerProfile", "jobSeekerProfile.member"})
    Page<Certificate> findByAdminReviewStatus(CertificateReviewStatus adminReviewStatus, Pageable pageable);
}
