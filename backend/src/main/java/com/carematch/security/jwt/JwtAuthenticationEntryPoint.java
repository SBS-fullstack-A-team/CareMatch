package com.carematch.security.jwt;

import com.carematch.common.exception.ErrorCode;
import com.carematch.common.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 인증 실패(미인증 또는 잘못된 토큰) 시 통일된 ErrorResponse 로 401 응답.
 * JwtAuthenticationFilter 가 심어둔 구체 에러코드가 있으면 그것을 사용.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        Object attr = request.getAttribute(JwtAuthenticationFilter.AUTH_ERROR_ATTR);
        ErrorCode errorCode = (attr instanceof ErrorCode ec) ? ec : ErrorCode.UNAUTHENTICATED;

        response.setStatus(errorCode.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(),
                ErrorResponse.of(errorCode, request.getRequestURI()));
    }
}
