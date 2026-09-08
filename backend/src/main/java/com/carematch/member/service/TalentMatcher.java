package com.carematch.member.service;

import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.repository.JobPostingRepository;
import com.carematch.jobposting.service.MatchScoreCalculator;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.PostingMatchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/**
 * 인재 ↔ 시설의 자기 공고 매칭. {@link MatchScoreCalculator}(구직자→공고) 를 역방향 화면에서 재사용한다.
 * 인재 목록/상세에서 "이 인재와 우리 공고 매칭도" 를 채운다.
 */
@Component
@RequiredArgsConstructor
public class TalentMatcher {

    private final JobPostingRepository jobPostingRepository;
    private final MatchScoreCalculator matchScoreCalculator;

    /** 이 시설회원이 등록한 OPEN 공고들. 목록 검색에서 한 번만 로드해 재사용하도록 분리. */
    public List<JobPosting> openPostingsOf(Long facilityMemberId) {
        return jobPostingRepository.findByFacilityProfileMemberIdAndStatus(
                facilityMemberId, JobPostingStatus.OPEN);
    }

    /** 주어진 공고들에 대한 매칭 결과(점수 내림차순). 인재가 희망조건 미설정이면 빈 리스트. */
    public List<PostingMatchResponse> matches(JobSeekerProfile seeker, List<JobPosting> postings) {
        return postings.stream()
                .map(jp -> {
                    Integer score = matchScoreCalculator.score(seeker, jp);
                    return score == null ? null
                            : new PostingMatchResponse(jp.getId(), jp.getTitle(), jp.getJobType().name(), score);
                })
                .filter(m -> m != null)
                .sorted(Comparator.comparing(PostingMatchResponse::matchingScore).reversed())
                .toList();
    }

    /** 이 시설의 OPEN 공고 전체에 대한 매칭 결과. */
    public List<PostingMatchResponse> matchesFor(JobSeekerProfile seeker, Long facilityMemberId) {
        return matches(seeker, openPostingsOf(facilityMemberId));
    }

    /** 매칭 결과 중 최고 점수. 빈 리스트면 null. */
    public Integer bestScore(List<PostingMatchResponse> matches) {
        return matches.isEmpty() ? null : matches.get(0).matchingScore();
    }

    /**
     * 목록 카드용 — 최고 매칭 점수만. 전체 매칭 리스트를 만들지 않고 max 만 구한다.
     * 인재 희망조건 미설정 / 공고 없음이면 null.
     */
    public Integer bestScore(JobSeekerProfile seeker, List<JobPosting> postings) {
        return postings.stream()
                .map(jp -> matchScoreCalculator.score(seeker, jp))
                .filter(s -> s != null)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }
}
