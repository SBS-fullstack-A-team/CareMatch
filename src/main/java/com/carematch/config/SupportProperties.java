package com.carematch.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 고객센터 정적 정보(전화상담 번호, 카카오 채널 등). DB 대신 설정값으로 관리.
 */
@ConfigurationProperties(prefix = "carematch.support")
public record SupportProperties(
        String tel,
        String kakaoChannelUrl,
        String operatingHours
) {
}
