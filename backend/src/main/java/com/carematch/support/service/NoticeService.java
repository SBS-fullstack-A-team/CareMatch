package com.carematch.support.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.support.domain.Notice;
import com.carematch.support.dto.SupportDtos.NoticeDetail;
import com.carematch.support.dto.SupportDtos.NoticeSummary;
import com.carematch.support.dto.SupportDtos.NoticeUpsertRequest;
import com.carematch.support.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    @Transactional(readOnly = true)
    public Page<NoticeSummary> list(Pageable pageable) {
        return noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc(pageable).map(NoticeSummary::from);
    }

    /** 상세 조회 시 조회수 증가. */
    @Transactional
    public NoticeDetail getAndIncreaseView(Long id) {
        Notice notice = load(id);
        notice.increaseViewCount();
        return NoticeDetail.from(notice);
    }

    @Transactional
    public NoticeDetail create(Long adminId, NoticeUpsertRequest req) {
        Notice notice = noticeRepository.save(Notice.builder()
                .title(req.title())
                .content(req.content())
                .pinned(req.pinned())
                .authorId(adminId)
                .build());
        return NoticeDetail.from(notice);
    }

    @Transactional
    public NoticeDetail update(Long id, NoticeUpsertRequest req) {
        Notice notice = load(id);
        notice.update(req.title(), req.content(), req.pinned());
        return NoticeDetail.from(notice);
    }

    @Transactional
    public void delete(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.NOTICE_NOT_FOUND);
        }
        noticeRepository.deleteById(id);
    }

    private Notice load(Long id) {
        return noticeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
    }
}
