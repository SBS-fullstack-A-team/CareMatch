package com.carematch.notification.repository;

import com.carematch.notification.domain.Notification;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByMemberIdOrderByCreatedAtDesc(Long memberId, Pageable pageable);

    Page<Notification> findByMemberIdAndReadFalseOrderByCreatedAtDesc(Long memberId, Pageable pageable);

    long countByMemberIdAndReadFalse(Long memberId);

    Optional<Notification> findByIdAndMemberId(Long id, Long memberId);

    @Modifying
    @Query("update Notification n set n.read = true where n.memberId = :memberId and n.read = false")
    int markAllRead(@Param("memberId") Long memberId);
}
