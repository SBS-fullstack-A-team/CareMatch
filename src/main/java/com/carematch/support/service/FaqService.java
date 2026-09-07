package com.carematch.support.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.support.domain.Faq;
import com.carematch.support.dto.SupportDtos.FaqResponse;
import com.carematch.support.dto.SupportDtos.FaqUpsertRequest;
import com.carematch.support.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FaqService {

    private final FaqRepository faqRepository;

    @Transactional(readOnly = true)
    public List<FaqResponse> list(String category) {
        List<Faq> faqs = (category == null || category.isBlank())
                ? faqRepository.findAllByOrderBySortOrderAscIdAsc()
                : faqRepository.findByCategoryOrderBySortOrderAscIdAsc(category);
        return faqs.stream().map(FaqResponse::from).toList();
    }

    @Transactional
    public FaqResponse create(FaqUpsertRequest req) {
        Faq faq = faqRepository.save(Faq.builder()
                .category(req.category())
                .question(req.question())
                .answer(req.answer())
                .sortOrder(req.sortOrder())
                .build());
        return FaqResponse.from(faq);
    }

    @Transactional
    public FaqResponse update(Long id, FaqUpsertRequest req) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAQ_NOT_FOUND));
        faq.update(req.category(), req.question(), req.answer(), req.sortOrder());
        return FaqResponse.from(faq);
    }

    @Transactional
    public void delete(Long id) {
        if (!faqRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.FAQ_NOT_FOUND);
        }
        faqRepository.deleteById(id);
    }
}
