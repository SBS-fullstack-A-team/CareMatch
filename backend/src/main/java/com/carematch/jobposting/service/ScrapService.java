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
        // 회원 row 에 비관적 락 — 확인→저장 구간의 동시요청 경쟁을 없앤다(같은 회원의 스크랩
        // 요청끼리만 직렬화되고 다른 회원에는 영향 없음). unique 제약 위반을 catch 하고 계속
        // 진행하는 방식은 트랜잭션을 rollback-only 로 표시해 정상 커밋 시점에
        // UnexpectedRollbackException 을 유발한다 — ContactUnlockService 참고.
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (scrapRepository.existsByMemberIdAndJobPostingId(memberId, jobPostingId)) {
            return;
        }
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_NOT_FOUND, "id=" + jobPostingId));
        scrapRepository.save(Scrap.builder().member(member).jobPosting(jobPosting).build());
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
