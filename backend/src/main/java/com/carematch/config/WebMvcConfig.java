package com.carematch.config;

import com.carematch.security.interceptor.FacilityApprovalInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 승인 완료된 시설회원만 접근 가능한 "핵심 기능" 경로에 인터셉터를 매핑.
 * (구인공고 CRUD 는 백엔드B 담당이지만, 경로 규칙은 미리 등록해 둔다)
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final FacilityApprovalInterceptor facilityApprovalInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(facilityApprovalInterceptor)
                .addPathPatterns(
                        "/api/jobseekers/**",         // 인재 열람(목록/상세/연락처) 전반
                        "/api/job-postings/**",       // 구인공고 등록/관리 (백엔드B 담당, 경로 예약)
                        "/api/job-posting-drafts/**"  // 구인공고 임시저장 (승인 시설만)
                )
                // 구직자 본인 프로필 조회는 차단 대상 아님
                .excludePathPatterns("/api/jobseekers/me", "/api/jobseekers/me/**");
    }
}
