package com.carematch.terms.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.dto.TermsAgreementRequest;
import com.carematch.terms.domain.Terms;
import com.carematch.terms.domain.TermsAgreement;
import com.carematch.terms.domain.TermsType;
import com.carematch.terms.repository.TermsAgreementRepository;
import com.carematch.terms.repository.TermsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * 약관 조회 + 회원가입 시 동의 검증/기록.
 * 필수 약관(SERVICE, PRIVACY) 미동의 시 가입 불가. 프론트 값을 서버에서 재검증한다.
 */
@Service
@RequiredArgsConstructor
public class TermsService {

    private final TermsRepository termsRepository;
    private final TermsAgreementRepository termsAgreementRepository;

    @Transactional(readOnly = true)
    public List<Terms> getActiveTerms() {
        return termsRepository.findByActiveTrue();
    }

    @Transactional(readOnly = true)
    public Terms getActiveByType(TermsType type) {
        return termsRepository.findByTypeAndActiveTrue(type)
                .orElseThrow(() -> new BusinessException(ErrorCode.TERMS_NOT_FOUND, type.name()));
    }

    /**
     * 회원가입 동의 검증 후 이력 저장.
     * - 각 요청 항목의 version 은 현재 active 버전과 일치해야 한다.
     * - 필수 약관은 agreed=true 여야 한다.
     * - 3종 모두 별도 레코드로 저장(마케팅 미동의도 false 레코드로 기록).
     */
    @Transactional
    public void recordSignupAgreements(Member member, List<TermsAgreementRequest> requests) {
        Map<TermsType, Terms> activeByType = new EnumMap<>(TermsType.class);
        for (Terms t : termsRepository.findByActiveTrue()) {
            activeByType.put(t.getType(), t);
        }

        Map<TermsType, TermsAgreementRequest> submitted = new EnumMap<>(TermsType.class);
        for (TermsAgreementRequest r : requests) {
            submitted.put(r.type(), r);
        }

        for (TermsType type : TermsType.values()) {
            Terms active = activeByType.get(type);
            if (active == null) {
                if (type.isRequired()) {
                    throw new BusinessException(ErrorCode.TERMS_NOT_FOUND, "no active terms for " + type);
                }
                continue; // 선택 약관(마케팅)의 active 버전이 없으면 건너뜀
            }
            TermsAgreementRequest r = submitted.get(type);
            boolean agreed = r != null && r.agreed();

            if (r != null && !active.getVersion().equals(r.version())) {
                throw new BusinessException(ErrorCode.TERMS_REAGREEMENT_REQUIRED,
                        type + " submitted=" + r.version() + " active=" + active.getVersion());
            }
            if (type.isRequired() && !agreed) {
                throw new BusinessException(ErrorCode.REQUIRED_TERMS_NOT_AGREED, type.name());
            }

            termsAgreementRepository.save(TermsAgreement.builder()
                    .member(member)
                    .termsType(type)
                    .termsVersion(active.getVersion())
                    .agreed(agreed)
                    .build());
        }
    }
}
