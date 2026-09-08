package com.carematch.terms.repository;

import com.carematch.terms.domain.Terms;
import com.carematch.terms.domain.TermsType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TermsRepository extends JpaRepository<Terms, Long> {

    List<Terms> findByActiveTrue();

    Optional<Terms> findByTypeAndActiveTrue(TermsType type);

    Optional<Terms> findByTypeAndVersion(TermsType type, String version);
}
