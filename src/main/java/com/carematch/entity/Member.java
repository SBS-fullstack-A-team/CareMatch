package com.carematch.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "member")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /** EMPLOYER는 관리자 승인 전까지 PENDING, JOB_SEEKER/ADMIN은 가입 즉시 APPROVED. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberStatus status;

    /** EMPLOYER(시설)만 사용. 사업자등록번호. */
    private String businessRegistrationNumber;

    // ===== 시설 프로필 (EMPLOYER 전용, 가입 후 별도 작성) =====

    /** 시설명 (예: "강남소망재가노인복지센터"). Member.name(담당자/대표자명)과 별개. */
    @Column(name = "facility_name")
    private String facilityName;

    @Enumerated(EnumType.STRING)
    @Column(name = "facility_type")
    private FacilityType facilityType;

    /** 담당자명 (예: "김민정"). */
    @Column(name = "manager_name")
    private String managerName;

    /** 담당자 직책 (예: "실장"). */
    @Column(name = "manager_position")
    private String managerPosition;

    @Column(name = "facility_address")
    private String facilityAddress;

    @Column(nullable = false)
    private Integer pointBalance;

    @Builder
    public Member(String email, String password, String name, String phone, Role role,
                  MemberStatus status, String businessRegistrationNumber) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.role = role;
        this.status = status;
        this.businessRegistrationNumber = businessRegistrationNumber;
        this.pointBalance = 0;
    }

    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void approve() {
        this.status = MemberStatus.APPROVED;
    }

    /** 시설 회원이 시설 프로필을 작성/수정한다. */
    public void updateFacilityProfile(String facilityName, FacilityType facilityType,
                                      String managerName, String managerPosition, String facilityAddress) {
        this.facilityName = facilityName;
        this.facilityType = facilityType;
        this.managerName = managerName;
        this.managerPosition = managerPosition;
        this.facilityAddress = facilityAddress;
    }

    /** 구인공고 등록에 필요한 시설 프로필이 갖춰졌는지. */
    public boolean hasFacilityProfile() {
        return facilityName != null && facilityType != null;
    }

    public void reject() {
        this.status = MemberStatus.REJECTED;
    }

    public boolean hasEnoughPoint(int amount) {
        return this.pointBalance >= amount;
    }

    public void usePoint(int amount) {
        this.pointBalance -= amount;
    }

    public void chargePoint(int amount) {
        this.pointBalance += amount;
    }
}
