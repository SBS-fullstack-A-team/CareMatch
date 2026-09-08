package com.carematch.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * 요청 1건당 method / path / status / 소요시간만 남기는 로깅 필터.
 *
 * 민감정보 보호:
 *  - 요청/응답 "본문(body)"은 절대 로깅하지 않는다. (비밀번호, 토큰, 주민번호 등 포함 위험)
 *  - Authorization / Cookie / Set-Cookie 등 인증 헤더도 로깅하지 않는다.
 *  - 쿼리스트링은 키만 남기고 값은 마스킹한다.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Set<String> SKIP_PREFIXES = Set.of("/actuator", "/h2-console", "/favicon.ico");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return SKIP_PREFIXES.stream().anyMatch(uri::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long start = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("reqId", requestId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            long took = System.currentTimeMillis() - start;
            log.info("{} {}{} -> {} ({}ms)",
                    request.getMethod(),
                    request.getRequestURI(),
                    maskedQueryString(request.getQueryString()),
                    response.getStatus(),
                    took);
            MDC.remove("reqId");
        }
    }

    private String maskedQueryString(String qs) {
        if (qs == null || qs.isBlank()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("?");
        for (String pair : qs.split("&")) {
            int eq = pair.indexOf('=');
            String key = eq < 0 ? pair : pair.substring(0, eq);
            sb.append(key).append("=***&");
        }
        sb.setLength(sb.length() - 1);
        return sb.toString();
    }
}
