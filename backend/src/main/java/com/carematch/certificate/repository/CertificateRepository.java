package com.carematch.certificate.repository;

import com.carematch.certificate.domain.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByJobSeekerProfileId(Long jobSeekerProfileId);

    List<Certificate> findByJobSeekerProfileIdIn(Collection<Long> jobSeekerProfileIds);
}
