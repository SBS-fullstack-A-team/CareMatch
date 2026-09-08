package com.carematch.security.interceptor;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.repository.FacilityProfileRepository;
import com.carematch.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 시설회원이 PENDING/REJECTED 상태면 핵심 기능(인재 열람, 공고 등록 등) 접근을 403 으로 차단.
 * WebMvcConfig 에서 핵심 기능 경로에만 매핑한다.
 *
 * SecurityFilterChain 의 role 인가는 "시설회원인가?"만 보고,
 * 이 인터셉터가 "승인된 시설회원인가?"를 추가로 본다.
 */
@Component
@RequiredArgsConstructor
public class FacilityApprovalInterceptor implements HandlerInterceptor {

    private final FacilityProfileRepository facilityProfileRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails principal)) {
            return true; // 인증/인가는 SecurityFilterChain 이 이미 처리
        }
        boolean isFacility = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACILITY"));
        if (!isFacility) {
            return true;
        }

        FacilityProfile profile = facilityProfileRepository.findByMemberId(principal.getMemberId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FACILITY_NOT_APPROVED, "no facility profile"));
        if (!profile.isApproved()) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_APPROVED,
                    "approvalStatus=" + profile.getApprovalStatus());
        }
        return true;
    }
}
