package com.carematch.jobposting.domain;

import com.carematch.common.entity.BaseTimeEntity;
import com.carematch.member.domain.FacilityProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 구인공고 임시저장. 등록 마법사(5단계)를 중간에 저장했다가 이어서 작성하기 위한 것.
 *
 * 완성 전이라 {@link JobPosting} 의 불변식(필수값)을 만족하지 못하므로 별도 엔티티로 둔다.
 * 폼 내용은 프론트가 스키마의 주인이며, 서버는 {@code formJson} 문자열을 그대로 보관·반환만 한다
 * (검색·정렬 대상 아님). {@code title} 만 목록 라벨용으로 따로 받는다.
 *
 * 발행(publish) 경로는 없다 — 프론트가 폼을 완성해 {@code POST /api/job-postings} 로 등록한 뒤
 * 이 임시저장을 {@code DELETE} 한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "job_posting_draft", indexes = {
        @Index(name = "idx_job_posting_draft_facility", columnList = "facility_profile_id")
})
public class JobPostingDraft extends BaseTimeEntity {

    /** 시설당 임시저장 최대 개수. */
    public static final int MAX_PER_FACILITY = 20;

    /** formJson 최대 길이(문자). */
    public static final int MAX_FORM_JSON_LENGTH = 20_000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facility_profile_id", nullable = false)
    private FacilityProfile facilityProfile;

    /** 목록에서 보여줄 라벨. 작성 중이라 비어 있을 수 있다. */
    @Column(name = "title", length = 100)
    private String title;

    /** 등록 폼 스냅샷(JSON 문자열). 스키마는 프론트 소유. */
    @Column(name = "form_json", columnDefinition = "TEXT")
    private String formJson;

    @Builder
    private JobPostingDraft(FacilityProfile facilityProfile, String title, String formJson) {
        this.facilityProfile = facilityProfile;
        this.title = title;
        this.formJson = formJson;
    }

    public void update(String title, String formJson) {
        this.title = title;
        this.formJson = formJson;
    }

    public boolean isOwnedBy(Long memberId) {
        return facilityProfile.getMember().getId().equals(memberId);
    }
}
