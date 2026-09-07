package com.carematch.support.repository;

import com.carematch.support.domain.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    Page<Notice> findAllByOrderByPinnedDescCreatedAtDesc(Pageable pageable);
}
