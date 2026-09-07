package com.carematch.support.controller;

import com.carematch.support.dto.SupportDtos.NoticeDetail;
import com.carematch.support.dto.SupportDtos.NoticeSummary;
import com.carematch.support.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 공지사항 조회(공개). */
@RestController
@RequestMapping("/api/support/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public Page<NoticeSummary> list(@PageableDefault(size = 10) Pageable pageable) {
        return noticeService.list(pageable);
    }

    @GetMapping("/{id}")
    public NoticeDetail detail(@PathVariable Long id) {
        return noticeService.getAndIncreaseView(id);
    }
}
