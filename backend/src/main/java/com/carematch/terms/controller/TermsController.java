package com.carematch.terms.controller;

import com.carematch.terms.domain.TermsType;
import com.carematch.terms.dto.TermsResponse;
import com.carematch.terms.service.TermsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 약관 조회(공개). 작성/개정은 관리자 API(별도)에서 처리.
 */
@RestController
@RequestMapping("/api/terms")
@RequiredArgsConstructor
public class TermsController {

    private final TermsService termsService;

    /** 현재 유효한 약관 3종 목록(본문 제외 요약) */
    @GetMapping
    public List<TermsResponse> activeTerms() {
        return termsService.getActiveTerms().stream().map(TermsResponse::summary).toList();
    }

    /** 특정 종류의 현재 유효 약관(본문 포함) */
    @GetMapping("/{type}")
    public TermsResponse activeTermsByType(@PathVariable TermsType type) {
        return TermsResponse.from(termsService.getActiveByType(type));
    }
}
