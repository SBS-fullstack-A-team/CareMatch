package com.carematch.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * 간단 헬스체크. (상세 헬스는 /actuator/health)
 * Render 헬스체크 경로로도 사용 가능.
 */
@RestController
public class HealthController {

    @Value("${spring.application.name:carematch}")
    private String appName;

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "app", appName,
                "timestamp", OffsetDateTime.now().toString());
    }
}
