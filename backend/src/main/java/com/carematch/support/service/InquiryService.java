package com.carematch.support.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.support.domain.Inquiry;
import com.carematch.support.domain.InquiryReply;
import com.carematch.support.domain.InquiryStatus;
import com.carematch.support.dto.SupportDtos.InquiryCreateRequest;
import com.carematch.support.dto.SupportDtos.InquiryReplyRequest;
import com.carematch.support.dto.SupportDtos.InquiryResponse;
import com.carematch.support.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 1:1 문의.
 * - 등록: 인증 사용자만(비회원 문의 정책 미확정)
 * - 조회: 본인 글만. 관리자는 전체.
 * - 알림 발송(이메일/카카오)은 MVP 에서 로그로 대체.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;

    @Transactional
    public InquiryResponse create(Long memberId, InquiryCreateRequest req) {
        Inquiry inquiry = inquiryRepository.save(Inquiry.builder()
                .memberId(memberId)
                .title(req.title())
                .content(req.content())
                .attachmentFileKey(req.attachmentFileKey())
                .build());
        log.info("[Inquiry][MOCK-NOTIFY] 신규 문의 등록 id={} memberId={} → 관리자 알림(목업)", inquiry.getId(), memberId);
        return InquiryResponse.from(inquiry);
    }

    @Transactional(readOnly = true)
    public Page<InquiryResponse> listMine(Long memberId, Pageable pageable) {
        return inquiryRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable)
                .map(InquiryResponse::summary);
    }

    @Transactional(readOnly = true)
    public Page<InquiryResponse> listAll(InquiryStatus status, Pageable pageable) {
        Page<Inquiry> page = (status == null)
                ? inquiryRepository.findAll(pageable)
                : inquiryRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return page.map(InquiryResponse::summary);
    }

    /** 상세 조회. 관리자가 아니면 본인 글만 허용. */
    @Transactional(readOnly = true)
    public InquiryResponse get(Long inquiryId, Long requesterId, boolean isAdmin) {
        Inquiry inquiry = inquiryRepository.findWithRepliesById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        if (!isAdmin && !inquiry.isOwnedBy(requesterId)) {
            throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED);
        }
        return InquiryResponse.from(inquiry);
    }

    @Transactional
    public InquiryResponse reply(Long inquiryId, Long adminId, InquiryReplyRequest req) {
        Inquiry inquiry = inquiryRepository.findWithRepliesById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        inquiry.addReply(InquiryReply.builder()
                .answeredBy(adminId)
                .content(req.content())
                .build());
        log.info("[Inquiry][MOCK-NOTIFY] 문의 답변 등록 id={} → 작성자 알림(목업)", inquiryId);
        return InquiryResponse.from(inquiry);
    }
}
