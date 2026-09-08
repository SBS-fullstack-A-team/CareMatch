package com.carematch.common.exception;

import lombok.Getter;

/**
 * 서비스 레이어에서 비즈니스 규칙 위반 시 던지는 공통 예외.
 * GlobalExceptionHandler 가 ErrorCode 의 기본 메시지를 응답으로 변환한다.
 *
 * 두 번째 인자(detail)는 "로그 전용" 상세 정보다. 응답 본문에는 절대 노출하지 않는다.
 * (사용자에게 보여줄 문구는 ErrorCode.message 를 충분히 구체적으로 정의해서 해결한다)
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String detailForLog) {
        super(errorCode.getMessage() + " (" + detailForLog + ")");
        this.errorCode = errorCode;
    }
}
