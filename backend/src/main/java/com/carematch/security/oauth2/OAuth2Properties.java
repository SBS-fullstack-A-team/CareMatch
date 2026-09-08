package com.carematch.security.oauth2;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * carematch.oauth2.* — 소셜 로그인 성공/실패 후 프론트로 돌려보낼 주소.
 */
@ConfigurationProperties(prefix = "carematch.oauth2")
public record OAuth2Properties(
        String successRedirectUri,
        String failureRedirectUri
) {
}
