package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.Scrap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ScrapRepository extends JpaRepository<Scrap, Long> {

    boolean existsByMemberIdAndJobPostingId(Long memberId, Long jobPostingId);

    long deleteByMemberIdAndJobPostingId(Long memberId, Long jobPostingId);

    /** 내 스크랩 목록 (최신순). 공고+시설까지 fetch 해서 SummaryResponse N+1 방지. */
    @EntityGraph(attributePaths = {
            "jobPosting", "jobPosting.facilityProfile", "jobPosting.facilityProfile.member"})
    Page<Scrap> findByMemberId(Long memberId, Pageable pageable);

    /** 주어진 공고 id 들 중 이 회원이 스크랩한 것만 반환 (목록 응답 scrapped 표시용). */
    @Query("select s.jobPosting.id from Scrap s where s.member.id = :memberId and s.jobPosting.id in :postingIds")
    List<Long> findScrappedPostingIds(@Param("memberId") Long memberId,
                                      @Param("postingIds") Collection<Long> postingIds);
}
