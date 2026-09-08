package com.carematch.jobposting.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.jobposting.domain.JobPostingDraft;
import com.carematch.jobposting.dto.JobPostingDraftDtos.DraftResponse;
import com.carematch.jobposting.dto.JobPostingDraftDtos.DraftSummary;
import com.carematch.jobposting.dto.JobPostingDraftDtos.SaveRequest;
import com.carematch.jobposting.repository.JobPostingDraftRepository;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.repository.FacilityProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 구인공고 임시저장 CRUD. 승인된 시설회원 본인만.
 *
 * 발행 경로는 없다 — 프론트가 폼을 완성해 {@code POST /api/job-postings} 로 등록한 뒤 임시저장을 삭제한다.
 * 접근 제어: SecurityFilterChain(ROLE_FACILITY) + FacilityApprovalInterceptor(승인 시설) 가
 * {@code /api/job-posting-drafts/**} 를 통제하고, 서비스는 방어적으로 승인/소유권을 한 번 더 확인한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostingDraftService {

    private final JobPostingDraftRepository draftRepository;
    private final FacilityProfileRepository facilityProfileRepository;

    @Transactional
    public DraftResponse create(Long memberId, SaveRequest req) {
        FacilityProfile facility = approvedFacility(memberId);
        if (draftRepository.countByFacilityProfileMemberId(memberId) >= JobPostingDraft.MAX_PER_FACILITY) {
            throw new BusinessException(ErrorCode.JOB_POSTING_DRAFT_LIMIT_EXCEEDED, "memberId=" + memberId);
        }
        JobPostingDraft draft = draftRepository.save(JobPostingDraft.builder()
                .facilityProfile(facility)
                .title(req.title())
                .formJson(req.formJson())
                .build());
        return DraftResponse.from(draft);
    }

    @Transactional
    public DraftResponse update(Long memberId, Long draftId, SaveRequest req) {
        JobPostingDraft draft = findOwned(memberId, draftId);
        draft.update(req.title(), req.formJson());
        return DraftResponse.from(draft);
    }

    public List<DraftSummary> list(Long memberId) {
        return draftRepository.findByFacilityProfileMemberIdOrderByUpdatedAtDesc(memberId)
                .stream().map(DraftSummary::from).toList();
    }

    public DraftResponse get(Long memberId, Long draftId) {
        return DraftResponse.from(findOwned(memberId, draftId));
    }

    @Transactional
    public void delete(Long memberId, Long draftId) {
        draftRepository.delete(findOwned(memberId, draftId));
    }

    private FacilityProfile approvedFacility(Long memberId) {
        FacilityProfile facility = facilityProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FACILITY_NOT_APPROVED, "no facility profile"));
        if (!facility.isApproved()) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_APPROVED,
                    "approvalStatus=" + facility.getApprovalStatus());
        }
        return facility;
    }

    private JobPostingDraft findOwned(Long memberId, Long draftId) {
        JobPostingDraft draft = draftRepository.findWithFacilityById(draftId)
                .orElseThrow(() -> new BusinessException(ErrorCode.JOB_POSTING_DRAFT_NOT_FOUND, "id=" + draftId));
        if (!draft.isOwnedBy(memberId)) {
            // 남의 임시저장 존재 여부는 노출하지 않는다 — 404 로 통일
            throw new BusinessException(ErrorCode.JOB_POSTING_DRAFT_NOT_FOUND, "not owner, memberId=" + memberId);
        }
        return draft;
    }
}
