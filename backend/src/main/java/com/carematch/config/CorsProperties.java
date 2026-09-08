package com.carematch.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "carematch.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
