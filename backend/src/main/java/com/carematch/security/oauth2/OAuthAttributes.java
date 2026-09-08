package com.carematch.security.oauth2;

import com.carematch.member.domain.SocialProvider;

import java.util.Map;
import java.util.UUID;

/**
 * provider 별로 제각각인 사용자 정보 응답을 공통 형태로 정규화한다.
 *
 * - GOOGLE: { sub, email, name, ... }
 * - NAVER : { resultcode, message, response: { id, email, name, mobile, ... } }
 * - KAKAO : { id, kakao_account: { email, profile: { nickname } } }
 */
public record OAuthAttributes(
        SocialProvider provider,
        String providerUserId,
        String email,
        String name
) {

    @SuppressWarnings("unchecked")
    public static OAuthAttributes of(String registrationId, Map<String, Object> attributes) {
        SocialProvider provider = SocialProvider.from(registrationId);
        return switch (provider) {
            case GOOGLE -> new OAuthAttributes(
                    provider,
                    (String) attributes.get("sub"),
                    (String) attributes.get("email"),
                    (String) attributes.getOrDefault("name", "구글사용자"));
            case NAVER -> {
                Map<String, Object> response = (Map<String, Object>) attributes.get("response");
                yield new OAuthAttributes(
                        provider,
                        (String) response.get("id"),
                        (String) response.get("email"),
                        (String) response.getOrDefault("name", "네이버사용자"));
            }
            case KAKAO -> {
                String id = String.valueOf(attributes.get("id"));
                Map<String, Object> account = (Map<String, Object>) attributes.getOrDefault("kakao_account", Map.of());
                Map<String, Object> profile = (Map<String, Object>) account.getOrDefault("profile", Map.of());
                yield new OAuthAttributes(
                        provider,
                        id,
                        (String) account.get("email"),
                        (String) profile.getOrDefault("nickname", "카카오사용자"));
            }
        };
    }

    /** provider 가 이메일을 안 주는 경우를 대비한 placeholder 이메일. */
    public String emailOrPlaceholder() {
        if (email != null && !email.isBlank()) {
            return email;
        }
        return "%s_%s@social.carematch.invalid".formatted(
                provider.name().toLowerCase(),
                UUID.nameUUIDFromBytes((provider.name() + providerUserId).getBytes()));
    }
}
