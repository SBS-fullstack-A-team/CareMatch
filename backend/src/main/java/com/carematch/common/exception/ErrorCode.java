package com.carematch.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 전역 에러 코드 정의.
 * - code: 클라이언트가 분기용으로 쓰는 문자열 식별자
 * - status: HTTP 상태
 * - message: 기본 사용자 노출 메시지 (민감정보 금지)
 */
public enum ErrorCode {

    // --- 공통 ---
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON_001", "요청 값이 올바르지 않습니다."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "COMMON_002", "대상을 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON_003", "허용되지 않은 메서드입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_500", "서버 오류가 발생했습니다."),

    // --- 인증/인가 ---
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "AUTH_001", "인증이 필요합니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH_002", "아이디 또는 비밀번호가 올바르지 않습니다."),
    ACCOUNT_LOCKED(HttpStatus.LOCKED, "AUTH_003", "로그인 시도 횟수를 초과하여 계정이 잠겼습니다. 잠시 후 다시 시도해 주세요."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_004", "토큰이 만료되었습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_005", "유효하지 않은 토큰입니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "AUTH_006", "재발급 토큰을 찾을 수 없거나 이미 무효화되었습니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH_007", "접근 권한이 없습니다."),
    ACCOUNT_NOT_ACTIVE(HttpStatus.FORBIDDEN, "AUTH_008", "활성 상태가 아닌 계정입니다."),
    ROLE_NOT_SELECTED(HttpStatus.FORBIDDEN, "AUTH_009", "회원 유형 선택이 완료되지 않았습니다."),
    ROLE_ALREADY_SELECTED(HttpStatus.CONFLICT, "AUTH_010", "이미 회원 유형이 확정된 계정입니다."),

    // --- 회원 ---
    DUPLICATE_LOGIN_ID(HttpStatus.CONFLICT, "MEMBER_001", "이미 사용 중인 아이디입니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "MEMBER_002", "이미 사용 중인 이메일입니다."),
    WEAK_PASSWORD(HttpStatus.BAD_REQUEST, "MEMBER_003",
            "비밀번호는 8~64자이며 영문·숫자·특수문자를 모두 포함해야 합니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER_004", "회원을 찾을 수 없습니다."),
    VERIFICATION_REQUIRED(HttpStatus.BAD_REQUEST, "MEMBER_005", "이메일 또는 휴대폰 인증이 완료되지 않았습니다."),
    INVALID_BUSINESS_NUMBER(HttpStatus.BAD_REQUEST, "MEMBER_006", "사업자등록번호 형식이 올바르지 않습니다."),

    // --- 약관 ---
    REQUIRED_TERMS_NOT_AGREED(HttpStatus.BAD_REQUEST, "TERMS_001", "필수 약관에 동의해야 합니다."),
    TERMS_NOT_FOUND(HttpStatus.NOT_FOUND, "TERMS_002", "약관을 찾을 수 없습니다."),
    TERMS_REAGREEMENT_REQUIRED(HttpStatus.CONFLICT, "TERMS_003", "약관이 개정되어 재동의가 필요합니다."),

    // --- 인증코드 ---
    VERIFICATION_CODE_NOT_FOUND(HttpStatus.NOT_FOUND, "VERIFY_001", "발급된 인증코드가 없습니다."),
    VERIFICATION_CODE_MISMATCH(HttpStatus.BAD_REQUEST, "VERIFY_002", "인증코드가 일치하지 않습니다."),
    VERIFICATION_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "VERIFY_003", "인증코드가 만료되었습니다."),
    VERIFICATION_ATTEMPT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "VERIFY_004", "인증 시도 횟수를 초과했습니다."),

    // --- 시설 승인 ---
    FACILITY_NOT_APPROVED(HttpStatus.FORBIDDEN, "FACILITY_001", "시설 회원 승인이 완료되지 않아 이용할 수 없는 기능입니다."),
    FACILITY_ALREADY_PROCESSED(HttpStatus.CONFLICT, "FACILITY_002", "이미 처리된 승인 요청입니다."),

    // --- 연락처 열람 ---
    CONTACT_UNLOCK_BLOCKED_EMPLOYED(HttpStatus.CONFLICT, "UNLOCK_001", "이미 취업이 완료된 구직자의 연락처는 열람할 수 없습니다."),
    POINT_CHARGE_FAILED(HttpStatus.PAYMENT_REQUIRED, "UNLOCK_002", "포인트가 부족합니다."),

    // --- 파일/스토리지 ---
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "FILE_001", "허용되지 않은 파일 형식입니다."),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_002", "파일 용량이 허용치를 초과했습니다."),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "FILE_003", "업로드된 파일을 확인할 수 없습니다."),

    // --- 구인공고 ---
    JOB_POSTING_NOT_FOUND(HttpStatus.NOT_FOUND, "JOBPOSTING_001", "구인공고를 찾을 수 없습니다."),
    JOB_POSTING_ACCESS_DENIED(HttpStatus.FORBIDDEN, "JOBPOSTING_002", "본인이 등록한 공고만 수정·삭제할 수 있습니다."),
    JOB_POSTING_POINT_SHORTAGE(HttpStatus.PAYMENT_REQUIRED, "JOBPOSTING_003", "구인공고 등록에 필요한 포인트가 부족합니다."),
    JOB_POSTING_ALREADY_CLOSED(HttpStatus.CONFLICT, "JOBPOSTING_004", "이미 마감된 공고입니다."),
    JOB_POSTING_DRAFT_NOT_FOUND(HttpStatus.NOT_FOUND, "JOBPOSTING_005", "임시저장한 공고를 찾을 수 없습니다."),
    JOB_POSTING_DRAFT_LIMIT_EXCEEDED(HttpStatus.CONFLICT, "JOBPOSTING_006", "임시저장은 최대 20건까지 가능합니다."),

    // --- 고객센터 ---
    NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "SUPPORT_001", "공지사항을 찾을 수 없습니다."),
    FAQ_NOT_FOUND(HttpStatus.NOT_FOUND, "SUPPORT_002", "FAQ를 찾을 수 없습니다."),
    INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "SUPPORT_003", "문의를 찾을 수 없습니다."),
    INQUIRY_ACCESS_DENIED(HttpStatus.FORBIDDEN, "SUPPORT_004", "본인 문의만 조회할 수 있습니다."),
    INQUIRY_ALREADY_ANSWERED(HttpStatus.CONFLICT, "SUPPORT_005", "이미 답변이 완료된 문의입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
