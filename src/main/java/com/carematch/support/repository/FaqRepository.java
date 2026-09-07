package com.carematch.support.repository;

import com.carematch.support.domain.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {

    List<Faq> findAllByOrderBySortOrderAscIdAsc();

    List<Faq> findByCategoryOrderBySortOrderAscIdAsc(String category);
}
