package com.carematch.member.service;

import com.carematch.certificate.domain.Certificate;
import com.carematch.certificate.repository.CertificateRepository;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.TalentSearchDtos.SearchCondition;
import com.carematch.member.dto.TalentSearchDtos.TalentSummary;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.member.repository.JobSeekerProfileSpecs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 인재정보 검색. 승인된 시설회원 / 관리자만.
 *
 * 정렬은 최근 갱신순(updatedAt desc) 고정. 매칭 점수 정렬(추천순)은 조회 시점 Java 계산이라
 * SQL 정렬이 불가 — 후속 과제(구인공고 RECOMMENDED 와 동일 제약).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TalentSearchService {

    private static final int MAX_PAGE_SIZE = 100;

    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final CertificateRepository certificateRepository;
    private final TalentMatcher talentMatcher;

    public PageResponse<TalentSummary> search(SearchCondition cond, int page, int size,
                                              Long viewerMemberId, boolean viewerIsFacility) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), safeSize,
                Sort.by(Sort.Direction.DESC, "updatedAt"));

        Page<JobSeekerProfile> result =
                jobSeekerProfileRepository.findAll(JobSeekerProfileSpecs.from(cond), pageable);

        Map<Long, List<String>> certNames = certificateNames(result.getContent());
        List<JobPosting> myPostings = viewerIsFacility
                ? talentMatcher.openPostingsOf(viewerMemberId)
                : List.of();

        return PageResponse.of(result, p -> TalentSummary.from(
                p,
                certNames.getOrDefault(p.getId(), List.of()),
                talentMatcher.bestScore(talentMatcher.matches(p, myPostings))));
    }

    private Map<Long, List<String>> certificateNames(List<JobSeekerProfile> profiles) {
        if (profiles.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = profiles.stream().map(JobSeekerProfile::getId).toList();
        return certificateRepository.findByJobSeekerProfileIdIn(ids).stream()
                .collect(Collectors.groupingBy(
                        c -> c.getJobSeekerProfile().getId(),
                        Collectors.mapping(Certificate::getCertificateName, Collectors.toList())));
    }
}
