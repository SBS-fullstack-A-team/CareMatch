package com.carematch.member.domain;

import com.carematch.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공통 회원 엔티티. 구직자/시설 공통 정보만 보관하고
 * 유형별 확장 정보는 JobSeekerProfile / FacilityProfile 로 분리한다(1:1).
 *
 * DB 벤더 미확정 → 표준 JPA 매핑만 사용(벤더 전용 타입/함수 미사용).
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "member", uniqueConstraints = {
        @UniqueConstraint(name = "uk_member_login_id", columnNames = "login_id"),
        @UniqueConstraint(name = "uk_member_email", columnNames = "email")
})
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 소셜 전용 회원은 최초에 null 일 수 있음(아이디/비번 미설정). */
    @Column(name = "login_id", length = 50)
    private String loginId;

    /** BCrypt 해시. 소셜 전용 회원은 null. 평문 저장 절대 금지. */
    @Column(name = "password", length = 100)
    private String password;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    /** 소셜 최초 로그인 후 유형 미선택이면 null. */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MemberStatus status;

    /** 이메일 또는 휴대폰 중 하나의 인증 완료 여부. */
    @Column(name = "verified", nullable = false)
    private boolean verified;

    /** 2차 확장(등급제/멤버십) 대비 필드. 지금은 BASIC 고정. */
    @Column(name = "membership_type", nullable = false, length = 20)
    private String membershipType;

    // --- 로그인 실패 잠금 정책 ---
    @Column(name = "login_fail_count", nullable = false)
    private int loginFailCount;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    @Builder
    private Member(String loginId, String password, String email, String name, String phone,
                   Role role, MemberStatus status, boolean verified, String membershipType) {
        this.loginId = loginId;
        this.password = password;
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.role = role;
        this.status = status == null ? MemberStatus.ACTIVE : status;
        this.verified = verified;
        this.membershipType = membershipType == null ? "BASIC" : membershipType;
        this.loginFailCount = 0;
    }

    // ---------------------------------------------------------------------
    // 도메인 동작
    // ---------------------------------------------------------------------

    public boolean isActive() {
        return status == MemberStatus.ACTIVE;
    }

    public boolean isRoleSelected() {
        return role != null;
    }

    public boolean isLocked(LocalDateTime now) {
        return accountLockedUntil != null && accountLockedUntil.isAfter(now);
    }

    public void markVerified() {
        this.verified = true;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    /** 소셜 간편가입 회원이 유형 선택을 마칠 때 호출. */
    public void assignRole(Role role) {
        this.role = role;
    }

    public void assignLoginCredentials(String loginId, String encodedPassword) {
        this.loginId = loginId;
        this.password = encodedPassword;
    }

    /** 로그인 실패 누적. 임계치 초과 시 lockUntil 로 잠금. */
    public void increaseLoginFail(int maxFailCount, LocalDateTime lockUntil) {
        this.loginFailCount++;
        if (this.loginFailCount >= maxFailCount) {
            this.accountLockedUntil = lockUntil;
            this.loginFailCount = 0;
        }
    }

    public void resetLoginFail() {
        this.loginFailCount = 0;
        this.accountLockedUntil = null;
    }

    public void suspend() {
        this.status = MemberStatus.SUSPENDED;
    }

    public void withdraw() {
        this.status = MemberStatus.WITHDRAWN;
    }
}
