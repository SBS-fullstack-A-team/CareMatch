package com.carematch.contact.domain;

import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 연락처 열람 이력. (열람 시설회원, 대상 구직자프로필) 조합은 유일.
 * → 동일 조합 재조회 시 PointService 호출 없이 무료로 언마스크 응답한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "contact_unlock_history", uniqueConstraints = {
        @UniqueConstraint(name = "uk_unlock_viewer_target",
                columnNames = {"facility_member_id", "jobseeker_profile_id"})
})
public class ContactUnlockHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 열람 주체(시설 회원). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facility_member_id", nullable = false)
    private Member facilityMember;

    /** 열람 대상(구직자 프로필). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jobseeker_profile_id", nullable = false)
    private JobSeekerProfile jobSeekerProfile;

    @Column(name = "unlocked_at", nullable = false)
    private LocalDateTime unlockedAt;

    /** 차감된 포인트(스텁 단계에서는 정책 상수. 실제 차감은 PointService 구현체가 담당). */
    @Column(name = "points_spent", nullable = false)
    private int pointsSpent;

    @Builder
    private ContactUnlockHistory(Member facilityMember, JobSeekerProfile jobSeekerProfile, int pointsSpent) {
        this.facilityMember = facilityMember;
        this.jobSeekerProfile = jobSeekerProfile;
        this.pointsSpent = pointsSpent;
        this.unlockedAt = LocalDateTime.now();
    }
}
