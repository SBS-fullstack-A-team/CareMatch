package com.carematch.service;

import com.carematch.entity.JobPosting;
import com.carematch.entity.JobSeeker;

/**
 * 규칙 기반 매칭 스코어 (0~100).
 * 실제 추천/ML 엔진이 아니라, 15일 일정에 맞춘 단순 가중치 합산 버전.
 * 필요하면 가중치나 조건만 바꿔서 쉽게 조정 가능하도록 한 곳에 모아둠.
 *
 * <p>구직자(JobSeeker)의 희망 조건은 아직 문자열이고 공고(JobPosting)는 enum 이라,
 * 직종 비교는 enum 이름 문자열로 맞춘다. 추후 JobSeeker.desiredJobType 을 enum 으로 바꾸면 정리할 것.
 */
public class MatchingScoreCalculator {

    private static final int REGION_MATCH_SCORE = 30;
    private static final int JOB_TYPE_MATCH_SCORE = 30;
    private static final int PAY_CONDITION_MATCH_SCORE = 40;

    private MatchingScoreCalculator() {
    }

    public static int calculate(JobSeeker jobSeeker, JobPosting jobPosting) {
        int score = 0;

        // 지역: 구직자 희망지역 == 공고 시군구
        if (equalsIgnoreNull(jobSeeker.getRegion(), jobPosting.getSigungu())) {
            score += REGION_MATCH_SCORE;
        }

        // 직종: 구직자 희망직종 문자열 == 공고 직종 enum 이름
        if (jobSeeker.getDesiredJobType() != null && jobPosting.getJobType() != null
                && jobSeeker.getDesiredJobType().equals(jobPosting.getJobType().name())) {
            score += JOB_TYPE_MATCH_SCORE;
        }

        // 급여: 공고 급여가 구직자 희망급여 이상
        if (jobSeeker.getDesiredPay() != null && jobPosting.getPayAmount() != null
                && jobPosting.getPayAmount() >= jobSeeker.getDesiredPay()) {
            score += PAY_CONDITION_MATCH_SCORE;
        }

        return score;
    }

    private static boolean equalsIgnoreNull(String a, String b) {
        return a != null && a.equals(b);
    }
}
