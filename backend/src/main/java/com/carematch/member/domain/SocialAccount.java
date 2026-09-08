package com.carematch.member.domain;

import com.carematch.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 소셜 계정 연결. (provider, providerUserId) 조합으로 회원을 식별한다.
 * 한 회원이 여러 소셜을 연결할 수 있으므로 Member : SocialAccount = 1 : N.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "social_account", uniqueConstraints = {
        @UniqueConstraint(name = "uk_social_provider_uid", columnNames = {"provider", "provider_user_id"})
})
public class SocialAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private SocialProvider provider;

    @Column(name = "provider_user_id", nullable = false, length = 100)
    private String providerUserId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Builder
    private SocialAccount(SocialProvider provider, String providerUserId, Member member) {
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.member = member;
    }
}
