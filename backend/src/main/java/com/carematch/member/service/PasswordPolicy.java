package com.carematch.member.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;

import java.util.regex.Pattern;

/**
 * 비밀번호 정책 검증.
 * - 8자 이상 64자 이하
 * - 영문자, 숫자, 특수문자 각각 1개 이상
 * - 공백 불가
 */
public final class PasswordPolicy {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 64;
    private static final Pattern LETTER = Pattern.compile("[a-zA-Z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[^a-zA-Z0-9]");

    private PasswordPolicy() {
    }

    public static void validate(String rawPassword) {
        if (rawPassword == null
                || rawPassword.length() < MIN_LENGTH
                || rawPassword.length() > MAX_LENGTH
                || rawPassword.contains(" ")
                || !LETTER.matcher(rawPassword).find()
                || !DIGIT.matcher(rawPassword).find()
                || !SPECIAL.matcher(rawPassword).find()) {
            throw new BusinessException(ErrorCode.WEAK_PASSWORD,
                    "비밀번호는 8~64자, 영문/숫자/특수문자를 모두 포함해야 합니다.");
        }
    }
}
