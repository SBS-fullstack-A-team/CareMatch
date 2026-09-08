package com.carematch.terms.dto;

import com.carematch.terms.domain.Terms;

public record TermsResponse(
        Long id,
        String type,
        String version,
        String title,
        boolean required,
        String content
) {
    public static TermsResponse from(Terms t) {
        return new TermsResponse(t.getId(), t.getType().name(), t.getVersion(),
                t.getTitle(), t.isRequired(), t.getContent());
    }

    public static TermsResponse summary(Terms t) {
        return new TermsResponse(t.getId(), t.getType().name(), t.getVersion(),
                t.getTitle(), t.isRequired(), null);
    }
}
