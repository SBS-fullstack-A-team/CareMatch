package com.carematch.support.controller;

import com.carematch.config.SupportProperties;
import com.carematch.support.dto.SupportDtos.SiteConfigResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 고객센터 정적 정보(전화상담 번호, 카카오 상담채널 등). DB 대신 설정값에서 제공.
 */
@RestController
@RequestMapping("/api/support/site-config")
@RequiredArgsConstructor
public class SiteConfigController {

    private final SupportProperties supportProperties;

    @GetMapping
    public SiteConfigResponse get() {
        return new SiteConfigResponse(
                supportProperties.tel(),
                supportProperties.kakaoChannelUrl(),
                supportProperties.operatingHours());
    }
}
