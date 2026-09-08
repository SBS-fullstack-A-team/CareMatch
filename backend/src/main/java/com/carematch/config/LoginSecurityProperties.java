package com.carematch.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * carematch.security.login.* — 로그인 실패 잠금 정책.
 */
@ConfigurationProperties(prefix = "carematch.security.login")
public record LoginSecurityProperties(
        int maxFailCount,
        long lockMinutes
) {
}
