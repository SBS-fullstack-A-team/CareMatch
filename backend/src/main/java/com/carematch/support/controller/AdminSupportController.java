package com.carematch.support.controller;

import com.carematch.security.CustomUserDetails;
import com.carematch.support.domain.InquiryStatus;
import com.carematch.support.dto.SupportDtos.FaqResponse;
import com.carematch.support.dto.SupportDtos.FaqUpsertRequest;
import com.carematch.support.dto.SupportDtos.InquiryReplyRequest;
import com.carematch.support.dto.SupportDtos.InquiryResponse;
import com.carematch.support.dto.SupportDtos.NoticeDetail;
import com.carematch.support.dto.SupportDtos.NoticeUpsertRequest;
import com.carematch.support.service.FaqService;
import com.carematch.support.service.InquiryService;
import com.carematch.support.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자: 공지/FAQ CRUD + 문의 전체 조회/답변.
 * 경로가 /api/admin/** → SecurityFilterChain 에서도 ROLE_ADMIN 강제.
 */
@RestController
@RequestMapping("/api/admin/support")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupportController {

    private final NoticeService noticeService;
    private final FaqService faqService;
    private final InquiryService inquiryService;

    // ---------------- Notice ----------------
    @PostMapping("/notices")
    public ResponseEntity<NoticeDetail> createNotice(@AuthenticationPrincipal CustomUserDetails principal,
                                                     @Valid @RequestBody NoticeUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noticeService.create(principal.getMemberId(), request));
    }

    @PutMapping("/notices/{id}")
    public NoticeDetail updateNotice(@PathVariable Long id, @Valid @RequestBody NoticeUpsertRequest request) {
        return noticeService.update(id, request);
    }

    @DeleteMapping("/notices/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------------- FAQ ----------------
    @PostMapping("/faqs")
    public ResponseEntity<FaqResponse> createFaq(@Valid @RequestBody FaqUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(faqService.create(request));
    }

    @PutMapping("/faqs/{id}")
    public FaqResponse updateFaq(@PathVariable Long id, @Valid @RequestBody FaqUpsertRequest request) {
        return faqService.update(id, request);
    }

    @DeleteMapping("/faqs/{id}")
    public ResponseEntity<Void> deleteFaq(@PathVariable Long id) {
        faqService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------------- Inquiry ----------------
    @GetMapping("/inquiries")
    public Page<InquiryResponse> listInquiries(@RequestParam(required = false) InquiryStatus status,
                                               @PageableDefault(size = 20) Pageable pageable) {
        return inquiryService.listAll(status, pageable);
    }

    @GetMapping("/inquiries/{id}")
    public InquiryResponse inquiryDetail(@PathVariable Long id,
                                         @AuthenticationPrincipal CustomUserDetails principal) {
        return inquiryService.get(id, principal.getMemberId(), true);
    }

    @PostMapping("/inquiries/{id}/replies")
    public InquiryResponse reply(@PathVariable Long id,
                                 @AuthenticationPrincipal CustomUserDetails principal,
                                 @Valid @RequestBody InquiryReplyRequest request) {
        return inquiryService.reply(id, principal.getMemberId(), request);
    }
}
