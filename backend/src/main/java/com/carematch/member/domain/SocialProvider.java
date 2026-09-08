package com.carematch.member.domain;

public enum SocialProvider {
    NAVER,
    KAKAO,
    GOOGLE;

    public static SocialProvider from(String registrationId) {
        return SocialProvider.valueOf(registrationId.toUpperCase());
    }
}
