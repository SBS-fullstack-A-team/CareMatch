package com.carematch.entity;

import com.carematch.entity.JobSeeker;
import com.carematch.entity.Member;
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

/** 구인자가 어떤 구직자의 연락처를 포인트로 열람했는지 기록 — 한 번 열람하면 재열람은 무료. */
@Getter
@Entity
@Table(
        name = "contact_unlock",
        uniqueConstraints = @UniqueConstraint(columnNames = {"employer_id", "job_seeker_id"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContactUnlock extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Member employer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_seeker_id", nullable = false)
    private JobSeeker jobSeeker;

    @Builder
    public ContactUnlock(Member employer, JobSeeker jobSeeker) {
        this.employer = employer;
        this.jobSeeker = jobSeeker;
    }
}
