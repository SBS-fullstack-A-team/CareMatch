package com.carematch.support.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.MemberRepository;
import com.carematch.notification.domain.NotificationType;
import com.carematch.notification.service.NotificationService;
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

import java.util.List;
import java.util.Map;
import java.util.function.Function;

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
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;

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

    /** 관리자 전체 목록. 작성자 이름/이메일까지 함께 내려준다(비회원 문의는 null). */
    @Transactional(readOnly = true)
    public Page<InquiryResponse> listAll(InquiryStatus status, Pageable pageable) {
        Page<Inquiry> page = (status == null)
                ? inquiryRepository.findAll(pageable)
                : inquiryRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        Map<Long, Member> members = loadMembers(page.getContent());
        return page.map(i -> {
            Member m = members.get(i.getMemberId());
            return InquiryResponse.adminSummary(i, m == null ? null : m.getName(), m == null ? null : m.getEmail());
        });
    }

    /** 상세 조회. 관리자가 아니면 본인 글만 허용. 관리자 조회 시 작성자 이름/이메일도 함께 채운다. */
    @Transactional(readOnly = true)
    public InquiryResponse get(Long inquiryId, Long requesterId, boolean isAdmin) {
        Inquiry inquiry = inquiryRepository.findWithRepliesById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        if (!isAdmin && !inquiry.isOwnedBy(requesterId)) {
            throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED);
        }
        if (!isAdmin || inquiry.getMemberId() == null) {
            return InquiryResponse.from(inquiry);
        }
        Member member = memberRepository.findById(inquiry.getMemberId()).orElse(null);
        return InquiryResponse.adminFrom(inquiry, member == null ? null : member.getName(),
                member == null ? null : member.getEmail());
    }

    private Map<Long, Member> loadMembers(List<Inquiry> inquiries) {
        List<Long> memberIds = inquiries.stream().map(Inquiry::getMemberId).filter(java.util.Objects::nonNull).distinct().toList();
        if (memberIds.isEmpty()) return Map.of();
        return memberRepository.findAllById(memberIds).stream()
                .collect(java.util.stream.Collectors.toMap(Member::getId, Function.identity()));
    }

    /** 관리자 전용(현재 AdminSupportController 에서만 호출) — 응답에도 작성자 이름/이메일을 채운다. */
    @Transactional
    public InquiryResponse reply(Long inquiryId, Long adminId, InquiryReplyRequest req) {
        Inquiry inquiry = inquiryRepository.findWithRepliesById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        inquiry.addReply(InquiryReply.builder()
                .answeredBy(adminId)
                .content(req.content())
                .build());
        // InquiryReply 는 IDENTITY 채번이라 flush 전엔 id 가 null 이다. 여기서 flush 안 하면
        // 방금 추가한 답변만 id=null 인 채로 응답에 실려서, 프론트가 이걸 리스트 key로 쓸 때
        // (여러 번 답변하는 경우) 다른 답변과 key 충돌이 난다.
        inquiryRepository.flush();
        if (inquiry.getMemberId() == null) {
            return InquiryResponse.from(inquiry);
        }
        notificationService.notify(inquiry.getMemberId(), NotificationType.INQUIRY_ANSWERED,
                "문의하신 '" + inquiry.getTitle() + "'에 답변이 등록되었습니다.",
                "/support/inquiries/" + inquiryId);
        Member member = memberRepository.findById(inquiry.getMemberId()).orElse(null);
        return InquiryResponse.adminFrom(inquiry, member == null ? null : member.getName(),
                member == null ? null : member.getEmail());
    }
}
