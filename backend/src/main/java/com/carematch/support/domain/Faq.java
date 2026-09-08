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
 * 자주 묻는 질문. 전체 공개 조회, 관리자 CRUD.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "faq")
public class Faq extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 예: "회원가입", "포인트", "매칭". 자유 문자열(코드 테이블은 추후). */
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "question", nullable = false, length = 300)
    private String question;

    @Lob
    @Column(name = "answer", nullable = false)
    private String answer;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Builder
    private Faq(String category, String question, String answer, int sortOrder) {
        this.category = category;
        this.question = question;
        this.answer = answer;
        this.sortOrder = sortOrder;
    }

    public void update(String category, String question, String answer, int sortOrder) {
        this.category = category;
        this.question = question;
        this.answer = answer;
        this.sortOrder = sortOrder;
    }
}
