package com.carematch.member.domain;

/**
 * 화면 글자 크기 설정. 프론트 GNB "글자크기"([기본]/[크게]/[더크게])와 1:1 대응.
 * 고연령 사용자 대응(쉬운 화면 모드) 설계의 일부.
 */
public enum FontScale {
    NORMAL,
    LARGE,
    XLARGE
}
