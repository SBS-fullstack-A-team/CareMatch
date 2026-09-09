package com.carematch.terms.domain;

import com.carematch.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 약관 본문 + 버전. (type, version) 유일.
 * 개정 시 새 version 레코드를 active=true 로 추가하고 이전 버전은 active=false 로.
 * 회원의 동의 버전이 현재 active 버전과 다르면 재동의를 요구할 수 있다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "terms", uniqueConstraints = {
        @UniqueConstraint(name = "uk_terms_type_version", columnNames = {"type", "version"})
})
public class Terms extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TermsType type;

    /** 예: "1.0", "2026-09-01" */
    @Column(name = "version", nullable = false, length = 30)
    private String version;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "required", nullable = false)
    private boolean required;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Builder
    private Terms(TermsType type, String version, String title, String content, Boolean required, boolean active) {
        this.type = type;
        this.version = version;
        this.title = title;
        this.content = content;
        this.required = required == null ? type.isRequired() : required;
        this.active = active;
    }

    public void deactivate() {
        this.active = false;
    }
}
