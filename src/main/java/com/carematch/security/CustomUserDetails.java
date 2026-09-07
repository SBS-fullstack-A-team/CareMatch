package com.carematch.security;

import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.security.jwt.JwtTokenProvider;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * 인증 주체. loginId/password 로그인과 JWT 인증 양쪽에서 principal 로 사용한다.
 * role 이 null(소셜 유형 미선택)이면 ROLE_GUEST 권한만 부여.
 */
@Getter
public class CustomUserDetails implements UserDetails {

    private final Long memberId;
    private final String username;   // loginId (없으면 "social:{memberId}")
    private final String password;   // 해시. 소셜 전용이면 null
    private final MemberStatus status;
    private final boolean locked;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Member member) {
        this.memberId = member.getId();
        this.username = member.getLoginId() != null ? member.getLoginId() : "social:" + member.getId();
        this.password = member.getPassword();
        this.status = member.getStatus();
        this.locked = member.isLocked(LocalDateTime.now());
        String authority = member.isRoleSelected() ? member.getRole().authority() : JwtTokenProvider.GUEST_ROLE;
        this.authorities = List.of(new SimpleGrantedAuthority(authority));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !locked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == MemberStatus.ACTIVE;
    }
}
