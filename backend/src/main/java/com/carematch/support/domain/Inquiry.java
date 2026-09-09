package com.carematch.support.domain;

import com.carematch.common.entity.BaseTimeEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 1:1 문의.
 * memberId 는 nullable — 비회원 문의 허용 여부는 정책 미확정이라 컬럼은 열어두되,
 * 현재 컨트롤러는 인증 사용자만 등록 가능하도록 막아둔다(정책 확정 시 완화).
 * 비회원 허용 시 guestEmail 로 연락, guestPasswordHash 로 열람 인증.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "inquiry", indexes = {
        @Index(name = "idx_inquiry_member", columnList = "member_id"),
        @Index(name = "idx_inquiry_status", columnList = "status")
})
public class Inquiry extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 작성자 회원 id. 비회원 문의면 null. */
    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "guest_email", length = 150)
    private String guestEmail;

    @Column(name = "guest_password_hash", length = 100)
    private String guestPasswordHash;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InquiryStatus status;

    /** 첨부파일 스토리지 키(선택). 공개 URL 아님. */
    @Column(name = "attachment_file_key", length = 300)
    private String attachmentFileKey;

    @OneToMany(mappedBy = "inquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<InquiryReply> replies = new ArrayList<>();

    @Builder
    private Inquiry(Long memberId, String guestEmail, String guestPasswordHash,
                    String title, String content, String attachmentFileKey) {
        this.memberId = memberId;
        this.guestEmail = guestEmail;
        this.guestPasswordHash = guestPasswordHash;
        this.title = title;
        this.content = content;
        this.attachmentFileKey = attachmentFileKey;
        this.status = InquiryStatus.PENDING;
    }

    public boolean isOwnedBy(Long candidateMemberId) {
        return memberId != null && memberId.equals(candidateMemberId);
    }

    public void addReply(InquiryReply reply) {
        replies.add(reply);
        reply.assignInquiry(this);
        this.status = InquiryStatus.ANSWERED;
    }
}
