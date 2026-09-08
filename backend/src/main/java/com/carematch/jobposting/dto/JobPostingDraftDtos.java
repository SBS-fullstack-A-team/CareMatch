package com.carematch.jobposting.dto;

import com.carematch.jobposting.domain.JobPostingDraft;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * 구인공고 임시저장 요청/응답 DTO.
 * {@code formJson} 은 프론트가 소유하는 등록 폼 스냅샷 문자열 — 서버는 검증 없이 보관·반환만 한다.
 */
public final class JobPostingDraftDtos {

    private JobPostingDraftDtos() {
    }

    /** 생성·수정 공통 요청. 둘 다 선택 — 완전 빈 임시저장도 허용한다. */
    public record SaveRequest(
            @Size(max = 100) String title,
            @Size(max = JobPostingDraft.MAX_FORM_JSON_LENGTH) String formJson
    ) {
    }

    /** 임시저장 단건(폼에 로드). */
    public record DraftResponse(
            Long id,
            String title,
            String formJson,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static DraftResponse from(JobPostingDraft d) {
            return new DraftResponse(d.getId(), d.getTitle(), d.getFormJson(),
                    d.getCreatedAt(), d.getUpdatedAt());
        }
    }

    /** 임시저장 목록 항목(formJson 제외). */
    public record DraftSummary(
            Long id,
            String title,
            LocalDateTime updatedAt
    ) {
        public static DraftSummary from(JobPostingDraft d) {
            return new DraftSummary(d.getId(), d.getTitle(), d.getUpdatedAt());
        }
    }
}
