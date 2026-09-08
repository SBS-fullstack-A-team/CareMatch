package com.carematch.support.domain;

import com.carematch.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 공지사항. 목록/상세 조회는 공개, 작성/수정/삭제는 ROLE_ADMIN.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notice")
public class Notice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "pinned", nullable = false)
    private boolean pinned;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    /** 작성 관리자 Member id (감사용). */
    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Builder
    private Notice(String title, String content, boolean pinned, Long authorId) {
        this.title = title;
        this.content = content;
        this.pinned = pinned;
        this.authorId = authorId;
        this.viewCount = 0;
    }

    public void update(String title, String content, boolean pinned) {
        this.title = title;
        this.content = content;
        this.pinned = pinned;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }
}
