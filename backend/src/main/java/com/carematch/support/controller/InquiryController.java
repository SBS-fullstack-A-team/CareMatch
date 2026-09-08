package com.carematch.support.controller;

import com.carematch.support.dto.SupportDtos.InquiryCreateRequest;
import com.carematch.support.dto.SupportDtos.InquiryResponse;
import com.carematch.support.service.InquiryService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 1:1 문의 (회원 본인). 조회는 본인 글만.
 */
@RestController
@RequestMapping("/api/support/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    public ResponseEntity<InquiryResponse> create(@AuthenticationPrincipal CustomUserDetails principal,
                                                  @Valid @RequestBody InquiryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inquiryService.create(principal.getMemberId(), request));
    }

    @GetMapping("/me")
    public Page<InquiryResponse> listMine(@AuthenticationPrincipal CustomUserDetails principal,
                                          @PageableDefault(size = 10) Pageable pageable) {
        return inquiryService.listMine(principal.getMemberId(), pageable);
    }

    @GetMapping("/{id}")
    public InquiryResponse detail(@AuthenticationPrincipal CustomUserDetails principal,
                                  @PathVariable Long id) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return inquiryService.get(id, principal.getMemberId(), isAdmin);
    }
}
