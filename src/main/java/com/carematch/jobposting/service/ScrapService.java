package com.carematch.jobposting.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.Scrap;
import com.carematch.jobposting.dto.JobPostingDtos.PageResponse;
import com.carematch.jobposting.dto.JobPostingDtos.SummaryResponse;
import com.carematch.jobposting.repository.JobPostingRepository;
import com.carematch.jobposting.repository.ScrapRepository;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 구인공고 스크랩(찜) 추가/삭제/목록. 인증된 회원 누구나 가능.
 * scrap/unscrap 은 멱등 — 이미 있으면/없으면 조용히 통과.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScrapService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ScrapRepository scrapRepository;
    private final JobPostingRepository jobPostingRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void scrap(Long memberId, Long jobPostingId) {
        if (scrapRepository.existsByMemberIdAndJobPostingId(memberId, jobPostingId)) {
            return;
        }
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        try {
            scrapRepository.save(Scrap.builder().member(member).jobPosting(jobPosting).build());
        } catch (DataIntegrityViolationException e) {
            // 동시 요청으로 유니크 제약 위반 — 이미 스크랩된 것으로 간주하고 통과
        }
    }

    @Transactional
    public void unscrap(Long memberId, Long jobPostingId) {
        scrapRepository.deleteByMemberIdAndJobPostingId(memberId, jobPostingId);
    }

    public PageResponse<SummaryResponse> myScraps(Long memberId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(
                scrapRepository.findByMemberId(memberId, pageable),
                s -> SummaryResponse.from(s.getJobPosting(), true));
    }
}
