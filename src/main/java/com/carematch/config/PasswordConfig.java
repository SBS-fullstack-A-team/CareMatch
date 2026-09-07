package com.carematch.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * PasswordEncoder 빈을 SecurityConfig 에서 분리한다.
 *
 * SecurityConfig 는 생성자에서 OAuth2SuccessHandler 를 주입받고,
 * OAuth2SuccessHandler -> AuthService -> PasswordEncoder(@Bean) 로 이어지는데
 * PasswordEncoder 가 SecurityConfig 안에 있으면
 *   SecurityConfig -> OAuth2SuccessHandler -> AuthService -> SecurityConfig
 * 순환참조가 되어 컨텍스트 로딩이 실패한다.
 * PasswordEncoder 를 의존성 없는 별도 설정으로 옮겨 고리를 끊는다.
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
