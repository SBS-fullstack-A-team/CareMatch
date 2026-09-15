package com.carematch.point;

/** 포인트 차감 정책 상수. 여러 도메인(연락처 열람 등)에서 공유한다. */
public final class PointPolicy {

    /** 연락처 열람 기본 차감 포인트. UI 목업의 "300P" 기준. */
    public static final int CONTACT_UNLOCK_COST = 300;

    private PointPolicy() {
    }
}
