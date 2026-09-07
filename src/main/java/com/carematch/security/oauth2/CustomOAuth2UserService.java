package com.carematch.security.oauth2;

import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.SocialAccount;
import com.carematch.member.repository.MemberRepository;
import com.carematch.member.repository.SocialAccountRepository;
import com.carematch.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * 소셜 로그인 시 사용자 정보를 조회해 회원을 찾거나(간편) 생성한다.
 * - 최초 로그인: Member(role=null, verified=true, ACTIVE) + SocialAccount 생성
 * - role 미선택 상태로 반환 → 성공 핸들러가 "유형 선택" 단계로 리다이렉트
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    public static final String ATTR_MEMBER_ID = "memberId";
    public static final String ATTR_ROLE_SELECTED = "roleSelected";

    private final MemberRepository memberRepository;
    private final SocialAccountRepository socialAccountRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        OAuthAttributes attrs = OAuthAttributes.of(registrationId, oAuth2User.getAttributes());
        Member member = findOrCreateMember(attrs);

        String authority = member.isRoleSelected()
                ? member.getRole().authority()
                : JwtTokenProvider.GUEST_ROLE;

        Map<String, Object> merged = new HashMap<>(oAuth2User.getAttributes());
        merged.put(ATTR_MEMBER_ID, member.getId());
        merged.put(ATTR_ROLE_SELECTED, member.isRoleSelected());

        return new DefaultOAuth2User(
                java.util.List.of(new SimpleGrantedAuthority(authority)),
                merged,
                nameAttributeKey);
    }

    private Member findOrCreateMember(OAuthAttributes attrs) {
        return socialAccountRepository
                .findByProviderAndProviderUserId(attrs.provider(), attrs.providerUserId())
                .map(SocialAccount::getMember)
                .orElseGet(() -> createSocialMember(attrs));
    }

    private Member createSocialMember(OAuthAttributes attrs) {
        String email = attrs.emailOrPlaceholder();
        // 이미 같은 이메일의 로컬 회원이 있으면 그 회원에 소셜 계정을 연결(계정 통합).
        Member member = memberRepository.findByEmail(email)
                .orElseGet(() -> memberRepository.save(Member.builder()
                        .email(email)
                        .name(attrs.name())
                        .role(null)                 // 유형 미선택
                        .status(MemberStatus.ACTIVE)
                        .verified(true)             // 소셜은 이메일 검증된 것으로 간주
                        .build()));

        socialAccountRepository.save(SocialAccount.builder()
                .provider(attrs.provider())
                .providerUserId(attrs.providerUserId())
                .member(member)
                .build());

        log.info("[OAuth2] 신규 소셜 회원 생성 memberId={} provider={}", member.getId(), attrs.provider());
        return member;
    }
}
