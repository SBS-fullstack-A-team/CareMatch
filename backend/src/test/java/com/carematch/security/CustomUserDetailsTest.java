package com.carematch.security;

import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** 역할 분기(인재 상세 마스킹 예외 등)가 기대대로 갈리는지 확인한다. */
class CustomUserDetailsTest {

    private static Member member(Role role) {
        return Member.builder()
                .loginId("tester")
                .password("hashed")
                .email("tester@carematch.local")
                .name("테스터")
                .phone("010-0000-0000")
                .role(role)
                .status(MemberStatus.ACTIVE)
                .verified(true)
                .build();
    }

    @Test
    @DisplayName("관리자는 isAdmin() 이 true 이고 ROLE_ADMIN 권한을 가진다")
    void adminIsAdmin() {
        CustomUserDetails principal = new CustomUserDetails(member(Role.ADMIN));

        assertThat(principal.isAdmin()).isTrue();
        assertThat(principal.getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
    }

    @Test
    @DisplayName("관리자가 아닌 역할은 isAdmin() 이 false")
    void othersAreNotAdmin() {
        assertThat(new CustomUserDetails(member(Role.FACILITY)).isAdmin()).isFalse();
        assertThat(new CustomUserDetails(member(Role.JOBSEEKER)).isAdmin()).isFalse();
        assertThat(new CustomUserDetails(member(Role.GENERAL)).isAdmin()).isFalse();
    }

    @Test
    @DisplayName("소셜 유형 미선택(role=null)은 GUEST 권한이라 관리자가 아니다")
    void guestIsNotAdmin() {
        CustomUserDetails principal = new CustomUserDetails(member(null));

        assertThat(principal.isAdmin()).isFalse();
    }
}
