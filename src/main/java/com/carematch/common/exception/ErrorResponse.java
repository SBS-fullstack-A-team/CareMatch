package com.carematch.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 통일된 에러 응답 포맷.
 * {
 *   "code": "MEMBER_002",
 *   "message": "이미 사용 중인 이메일입니다.",
 *   "timestamp": "2026-09-07T12:34:56.789+09:00",
 *   "path": "/api/members/jobseekers",
 *   "fieldErrors": [ { "field": "email", "reason": "형식이 올바르지 않습니다." } ]
 * }
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ErrorResponse(
        String code,
        String message,
        OffsetDateTime timestamp,
        String path,
        List<FieldError> fieldErrors
) {
    public record FieldError(String field, String reason) {
    }

    public static ErrorResponse of(ErrorCode errorCode, String path) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage(),
                OffsetDateTime.now(), path, List.of());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message, String path) {
        return new ErrorResponse(errorCode.getCode(), message,
                OffsetDateTime.now(), path, List.of());
    }

    public static ErrorResponse of(ErrorCode errorCode, String path, List<FieldError> fieldErrors) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage(),
                OffsetDateTime.now(), path, fieldErrors);
    }
}
