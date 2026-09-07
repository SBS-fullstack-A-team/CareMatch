package com.carematch.support.controller;

import com.carematch.support.dto.SupportDtos.FaqResponse;
import com.carematch.support.service.FaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** FAQ 조회(공개). */
@RestController
@RequestMapping("/api/support/faqs")
@RequiredArgsConstructor
public class FaqController {

    private final FaqService faqService;

    @GetMapping
    public List<FaqResponse> list(@RequestParam(required = false) String category) {
        return faqService.list(category);
    }
}
