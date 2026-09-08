package com.carematch.support.dto;

import com.carematch.support.domain.Faq;
import com.carematch.support.domain.Inquiry;
import com.carematch.support.domain.InquiryReply;
import com.carematch.support.domain.Notice;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class SupportDtos {

    private SupportDtos() {
    }

    // ---------------- Notice ----------------
    public record NoticeUpsertRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank String content,
            boolean pinned
    ) {
    }

    public record NoticeSummary(Long id, String title, boolean pinned, long viewCount, LocalDateTime createdAt) {
        public static NoticeSummary from(Notice n) {
            return new NoticeSummary(n.getId(), n.getTitle(), n.isPinned(), n.getViewCount(), n.getCreatedAt());
        }
    }

    public record NoticeDetail(Long id, String title, String content, boolean pinned,
                               long viewCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        public static NoticeDetail from(Notice n) {
            return new NoticeDetail(n.getId(), n.getTitle(), n.getContent(), n.isPinned(),
                    n.getViewCount(), n.getCreatedAt(), n.getUpdatedAt());
        }
    }

    // ---------------- FAQ ----------------
    public record FaqUpsertRequest(
            @NotBlank @Size(max = 50) String category,
            @NotBlank @Size(max = 300) String question,
            @NotBlank String answer,
            int sortOrder
    ) {
    }

    public record FaqResponse(Long id, String category, String question, String answer, int sortOrder) {
        public static FaqResponse from(Faq f) {
            return new FaqResponse(f.getId(), f.getCategory(), f.getQuestion(), f.getAnswer(), f.getSortOrder());
        }
    }

    // ---------------- Inquiry ----------------
    public record InquiryCreateRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank String content,
            String attachmentFileKey   // 선택. POST /api/files/upload-url (purpose=INQUIRY_ATTACHMENT) 로 발급
    ) {
    }

    public record InquiryReplyRequest(
            @NotBlank String content
    ) {
    }

    public record InquiryReplyResponse(Long id, Long answeredBy, String content, LocalDateTime createdAt) {
        public static InquiryReplyResponse from(InquiryReply r) {
            return new InquiryReplyResponse(r.getId(), r.getAnsweredBy(), r.getContent(), r.getCreatedAt());
        }
    }

    public record InquiryResponse(
            Long id,
            Long memberId,
            String title,
            String content,
            String status,
            String attachmentFileKey,
            LocalDateTime createdAt,
            List<InquiryReplyResponse> replies
    ) {
        public static InquiryResponse from(Inquiry i) {
            return new InquiryResponse(
                    i.getId(), i.getMemberId(), i.getTitle(), i.getContent(),
                    i.getStatus().name(), i.getAttachmentFileKey(), i.getCreatedAt(),
                    i.getReplies().stream().map(InquiryReplyResponse::from).toList());
        }

        public static InquiryResponse summary(Inquiry i) {
            return new InquiryResponse(
                    i.getId(), i.getMemberId(), i.getTitle(), null,
                    i.getStatus().name(), null, i.getCreatedAt(), List.of());
        }
    }

    // ---------------- Site config ----------------
    public record SiteConfigResponse(String tel, String kakaoChannelUrl, String operatingHours) {
    }
}
