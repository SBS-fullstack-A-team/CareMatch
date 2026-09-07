package com.carematch.terms.domain;

import com.carematch.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 회원별 약관 동의 "이력". 하나의 동의 행위 = 하나의 레코드.
 * 재동의 시 새 레코드를 추가한다(이력이 남도록 UPDATE 하지 않음).
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "terms_agreement", indexes = {
        @Index(name = "idx_terms_agreement_member", columnList = "member_id, terms_type")
})
public class TermsAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(name = "terms_type", nullable = false, length = 20)
    private TermsType termsType;

    @Column(name = "terms_version", nullable = false, length = 30)
    private String termsVersion;

    @Column(name = "agreed", nullable = false)
    private boolean agreed;

    @Column(name = "agreed_at", nullable = false)
    private LocalDateTime agreedAt;

    @Builder
    private TermsAgreement(Member member, TermsType termsType, String termsVersion, boolean agreed) {
        this.member = member;
        this.termsType = termsType;
        this.termsVersion = termsVersion;
        this.agreed = agreed;
        this.agreedAt = LocalDateTime.now();
    }
}
