package com.carematch.security.jwt;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import com.carematch.security.CustomUserDetails;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Bearer 액세스 토큰을 검증하고 SecurityContext 에 인증을 채운다.
 * 토큰이 없으면 그냥 통과(익명). 토큰이 잘못되면 request attribute 에 에러코드를 심고
 * 통과시켜 EntryPoint 가 통일된 포맷으로 응답하게 한다.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String AUTH_ERROR_ATTR = "carematch.authError";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider tokenProvider;
    private final MemberRepository memberRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = tokenProvider.parse(token);
                if (!tokenProvider.isAccessToken(claims)) {
                    throw new BusinessException(ErrorCode.INVALID_TOKEN, "not an access token");
                }
                Long memberId = tokenProvider.getMemberId(claims);
                Member member = memberRepository.findById(memberId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN, "member not found"));

                if (!member.isActive()) {
                    request.setAttribute(AUTH_ERROR_ATTR, ErrorCode.ACCOUNT_NOT_ACTIVE);
                } else {
                    CustomUserDetails principal = new CustomUserDetails(member);
                    var authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (BusinessException e) {
                request.setAttribute(AUTH_ERROR_ATTR, e.getErrorCode());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }
}
