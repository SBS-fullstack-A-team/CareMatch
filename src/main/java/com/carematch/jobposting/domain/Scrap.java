package com.carematch.jobposting.domain;

import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.member.domain.Member;
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

/**
 * 구인공고 스크랩(찜). (회원, 공고) 조합은 유일. createdAt = 찜한 시각.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "job_posting_scrap", uniqueConstraints = {
        @UniqueConstraint(name = "uk_scrap_member_posting", columnNames = {"member_id", "job_posting_id"})
})
public class Scrap extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @Builder
    private Scrap(Member member, JobPosting jobPosting) {
        this.member = member;
        this.jobPosting = jobPosting;
    }
}
