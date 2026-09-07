package com.carematch.terms.repository;

import com.carematch.terms.domain.TermsAgreement;
import com.carematch.terms.domain.TermsType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TermsAgreementRepository extends JpaRepository<TermsAgreement, Long> {

    List<TermsAgreement> findByMemberIdOrderByAgreedAtDesc(Long memberId);

    List<TermsAgreement> findByMemberIdAndTermsTypeOrderByAgreedAtDesc(Long memberId, TermsType termsType);
}
