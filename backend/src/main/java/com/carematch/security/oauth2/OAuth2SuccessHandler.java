package com.carematch.security.oauth2;

import com.carematch.auth.dto.AuthDtos.TokenResponse;
import com.carematch.auth.service.AuthService;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * 소셜 로그인 성공 → JWT 발급 → 프론트 콜백 URL 로 리다이렉트.
 * roleSelected=false 면 프론트가 "회원 유형 선택" 화면을 띄우고
 *   POST /api/auth/social/select-role 로 유형을 확정한다.
 *
 * 토큰을 쿼리스트링으로 넘기는 방식은 브라우저 히스토리에 남는 약점이 있으므로,
 * 운영에서는 단회성 code 교환 방식으로 강화 권장(주석으로 남김).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final MemberRepository memberRepository;
    private final OAuth2Properties oAuth2Properties;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        Object memberIdAttr = principal.getAttribute(CustomOAuth2UserService.ATTR_MEMBER_ID);
        Long memberId = Long.valueOf(String.valueOf(memberIdAttr));

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        TokenResponse token = authService.issueTokens(member);

        String targetUrl = UriComponentsBuilder.fromUriString(oAuth2Properties.successRedirectUri())
                .queryParam("accessToken", token.accessToken())
                .queryParam("refreshToken", token.refreshToken())
                .queryParam("roleSelected", token.roleSelected())
                .build().toUriString();

        log.info("[OAuth2] 로그인 성공 memberId={} roleSelected={}", memberId, token.roleSelected());
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
