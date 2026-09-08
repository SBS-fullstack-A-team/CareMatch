package com.carematch.support.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 문의 답변. 문의 1건에 관리자 답변 N건 허용.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "inquiry_reply")
public class InquiryReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Inquiry inquiry;

    /** 답변 관리자 Member id. */
    @Column(name = "answered_by", nullable = false)
    private Long answeredBy;

    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder
    private InquiryReply(Long answeredBy, String content) {
        this.answeredBy = answeredBy;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    void assignInquiry(Inquiry inquiry) {
        this.inquiry = inquiry;
    }
}
