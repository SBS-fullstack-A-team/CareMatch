package com.carematch.config;

import com.carematch.security.CustomUserDetailsService;
import com.carematch.security.jwt.JwtAccessDeniedHandler;
import com.carematch.security.jwt.JwtAuthenticationEntryPoint;
import com.carematch.security.jwt.JwtAuthenticationFilter;
import com.carematch.security.oauth2.CustomOAuth2UserService;
import com.carematch.security.oauth2.OAuth2FailureHandler;
import com.carematch.security.oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // @PreAuthorize 활성화
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final CustomUserDetailsService userDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final CorsProperties corsProperties;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 비활성화 이유:
                //  - 본 서버는 순수 REST API. 인증은 Authorization 헤더의 JWT 로만 수행하고
                //    세션 쿠키/폼 로그인을 쓰지 않는다. 브라우저가 자동 첨부하는 자격증명(쿠키)이
                //    없으므로 CSRF 공격 표면이 존재하지 않는다. 따라서 CSRF 토큰 메커니즘 불필요.
                .csrf(csrf -> csrf.disable())

                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // API 인증은 JWT 로만 처리(세션 미의존).
                // 단 OAuth2 로그인은 provider 왕복 사이 authorization_request 를 잠깐 보관해야 하므로
                // IF_REQUIRED 로 둔다(OAuth2 핸드셰이크 중에만 임시 세션 생성, 이후 API 는 무상태).
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))

                // h2-console iframe 렌더링 허용(local 프로필에서만 접근 가능)
                .headers(headers -> headers.frameOptions(fo -> fo.sameOrigin()))

                .authorizeHttpRequests(auth -> auth
                        // --- 헬스체크 / 문서 ---
                        .requestMatchers("/health", "/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()

                        // --- 인증 없이 허용 (회원가입/로그인/인증코드) ---
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/login", "/api/auth/reissue", "/api/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/members/jobseekers", "/api/members/facilities").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/members/exists").permitAll()
                        .requestMatchers("/api/verifications/**").permitAll()
                        // 회원가입 전 사업자등록증 업로드 URL 발급 필요 → 익명 허용
                        // (운영에서는 rate-limit / CAPTCHA 등 추가 권장)
                        .requestMatchers(HttpMethod.POST, "/api/files/upload-url", "/api/files/confirm").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        // --- 약관: 조회는 공개 ---
                        .requestMatchers(HttpMethod.GET, "/api/terms/**").permitAll()

                        // --- 고객센터: 공지/FAQ/사이트설정 조회는 공개 ---
                        .requestMatchers(HttpMethod.GET,
                                "/api/support/notices/**", "/api/support/faqs/**", "/api/support/site-config").permitAll()

                        // --- 구인공고: 목록/상세 조회는 비로그인 공개 (등록/수정/삭제는 ROLE_FACILITY) ---
                        .requestMatchers(HttpMethod.GET, "/api/job-postings", "/api/job-postings/*").permitAll()

                        // --- 소셜 최초 로그인 후 회원유형 선택 (GUEST 포함 인증만 요구) ---
                        .requestMatchers(HttpMethod.POST, "/api/auth/social/select-role").authenticated()

                        // --- 관리자 전용 ---
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // --- 그 외 전부 인증 필요 ---
                        .anyRequest().authenticated())

                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler))

                .userDetailsService(userDetailsService)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * JwtAuthenticationFilter 는 @Component 라서 서블릿 필터 체인에도 자동 등록된다.
     * 시큐리티 체인에서만 동작하도록 서블릿 자동 등록은 비활성화(중복 실행 방지).
     */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * CORS 화이트리스트 — Vercel 배포 도메인만 허용.
     * origin 은 환경변수(carematch.cors.allowed-origins)로 주입. 와일드카드(*) 미사용.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(corsProperties.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Location"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
