package com.carematch.member.dto;

import java.time.LocalTime;
import java.util.List;

/**
 * 구직자 프로필 응답.
 * 연락처(phone)와 거주지(residence)는 기본적으로 마스킹된 값이 내려간다.
 * contactUnlocked=true 인 경우(= 열람 이력 보유)에만 언마스크된 값이 채워진다.
 *
 * @param contactUnlocked 요청자(시설회원)가 이 프로필의 연락처를 이미 열람했는지
 * @param unlockCost      아직 열람 안 했을 때 차감될 포인트(목업 기준 300)
 */
public record JobSeekerProfileResponse(
        Long profileId,
        Long memberId,
        String name,
        String employmentStatus,
        String phone,
        String residence,
        String introduction,
        boolean contactUnlocked,
        int unlockCost,
        List<CertificateResponse> certificates,

        // 인적사항 / 표시용 (미설정 시 null / 빈 리스트)
        String gender,
        Integer age,
        String photoUrl,
        Integer careerYears,
        String education,
        String headline,
        List<String> availableTasks,

        // 희망 근무조건 (미설정 시 null). 매칭 스코어 계산 근거.
        String desiredJobType,
        String desiredWorkType,
        String desiredSido,
        String desiredSigungu,
        String desiredPayType,
        Integer desiredMinPay,
        List<String> desiredEmploymentTypes,
        String desiredWorkDays,
        LocalTime desiredWorkStartTime,
        LocalTime desiredWorkEndTime,

        /** 시설회원이 볼 때: 그 시설의 OPEN 공고 중 최고 매칭 점수. 본인(/me)·매칭 불가면 null. */
        Integer matchingScore,
        /** 시설회원이 볼 때: 그 시설의 OPEN 공고별 매칭 결과(점수 내림차순). 본인(/me)이면 빈 리스트. */
        List<PostingMatchResponse> postingMatches
) {
}
