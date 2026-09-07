package com.carematch.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다."),
    JOB_POSTING_NOT_FOUND(HttpStatus.NOT_FOUND, "구인공고를 찾을 수 없습니다."),
    JOB_SEEKER_NOT_FOUND(HttpStatus.NOT_FOUND, "구직자 정보를 찾을 수 없습니다."),
    APPLICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "지원 내역을 찾을 수 없습니다."),
    DUPLICATE_APPLICATION(HttpStatus.CONFLICT, "이미 지원한 공고입니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    INVALID_APPLICATION_STATUS(HttpStatus.BAD_REQUEST, "처리할 수 없는 지원 상태입니다."),
    BUSINESS_REGISTRATION_NUMBER_REQUIRED(HttpStatus.BAD_REQUEST, "시설 회원은 사업자등록번호가 필요합니다."),
    EMPLOYER_NOT_APPROVED(HttpStatus.FORBIDDEN, "관리자 승인이 완료된 시설 회원만 이용할 수 있습니다."),
    EMPLOYER_ONLY(HttpStatus.FORBIDDEN, "시설 회원만 이용할 수 있습니다."),
    FACILITY_PROFILE_REQUIRED(HttpStatus.BAD_REQUEST, "시설 프로필을 먼저 등록해야 합니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 형식이 올바르지 않습니다."),
    INSUFFICIENT_POINT(HttpStatus.BAD_REQUEST, "포인트가 부족합니다."),
    JOB_SEEKER_ALREADY_EMPLOYED(HttpStatus.CONFLICT, "이미 취업 완료된 구직자입니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
