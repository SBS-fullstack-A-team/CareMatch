package com.carematch.jobposting.service;

import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.DesiredRegion;
import com.carematch.member.domain.JobSeekerProfile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 구직자 희망조건 ↔ 구인공고 적합도 점수(0~100) + 일치 사유 문구.
 *
 * 구직자가 지정한 희망조건만 채점 대상이다. 지정한 항목들의 가중치 합을 분모,
 * 실제 부합한 정도를 분자로 하여 100점 만점으로 환산한다.
 * 지정한 희망조건이 하나도 없으면 채점 불가 → {@code null}.
 *
 * 가중치: 직종 35 / 지역 30 / 근무형태 10 + 근무 시간대 10 / 급여 15.
 *
 * <p>근무 축은 두 개다(docs/ENUM_MAPPING.md §2): {@code WorkType}(출퇴근/입주 — 항상 존재,
 * 협의는 일치 처리)과 {@code WorkSchedule}(주간/오전/오후/야간/교대 — 공고에 없을 수 있음).
 * 각각 구직자가 희망을 지정했을 때만 채점하며, 시간대는 공고에도 값이 있을 때만 채점한다
 * (입주형 등 시간대 없는 공고는 시간대 축에서 벌점 없음).
 */
@Component
public class MatchScoreCalculator {

    private static final int W_JOB_TYPE = 35;
    private static final int W_REGION = 30;
    private static final int W_WORK_TYPE = 10;
    private static final int W_WORK_SCHEDULE = 10;
    private static final int W_PAY = 15;

    /**
     * 매칭 결과. 채점 불가면 {@code score == null} 이고 {@code reasons} 는 빈 리스트.
     * {@code reasons} 는 실제로 일치한 항목만 담는다(상세 화면 "이래서 잘 맞아요" 문구용).
     */
    public record MatchResult(Integer score, List<String> reasons) {
        static final MatchResult NONE = new MatchResult(null, List.of());
    }

    /** 채점 불가(구직자 정보 없음 / 희망조건 미설정)면 null. */
    public Integer score(JobSeekerProfile seeker, JobPosting posting) {
        return evaluate(seeker, posting).score();
    }

    /** 점수와 일치 사유를 함께 계산한다. 채점 불가면 {@link MatchResult#NONE}. */
    public MatchResult evaluate(JobSeekerProfile seeker, JobPosting posting) {
        if (seeker == null || posting == null) {
            return MatchResult.NONE;
        }

        double earned = 0;
        int total = 0;
        List<String> reasons = new ArrayList<>();

        if (seeker.getDesiredJobType() != null) {
            total += W_JOB_TYPE;
            if (seeker.getDesiredJobType() == posting.getJobType()) {
                earned += W_JOB_TYPE;
                reasons.add("희망하는 직종과 일치해요");
            }
        }

        if (!seeker.getDesiredRegions().isEmpty()) {
            total += W_REGION;
            double ratio = bestRegionRatio(seeker, posting);
            earned += W_REGION * ratio;
            if (ratio >= 1.0) {
                reasons.add("희망하는 근무지와 일치해요");
            } else if (ratio > 0) {
                reasons.add("희망하는 시·도와 일치해요");
            }
        }

        if (seeker.getDesiredWorkType() != null) {
            total += W_WORK_TYPE;
            if (workTypeMatches(seeker.getDesiredWorkType(), posting.getWorkType())) {
                earned += W_WORK_TYPE;
                reasons.add("희망하는 근무형태와 일치해요");
            }
        }

        if (seeker.getDesiredWorkSchedule() != null && posting.getWorkSchedule() != null) {
            total += W_WORK_SCHEDULE;
            if (seeker.getDesiredWorkSchedule() == posting.getWorkSchedule()) {
                earned += W_WORK_SCHEDULE;
                reasons.add("희망하는 근무 시간대와 일치해요");
            }
        }

        if (seeker.getDesiredPayType() != null && seeker.getDesiredMinPay() != null) {
            total += W_PAY;
            double ratio = payRatio(seeker, posting);
            earned += W_PAY * ratio;
            if (ratio >= 1.0) {
                reasons.add("희망하는 급여 조건을 충족해요");
            }
        }

        if (total == 0) {
            return MatchResult.NONE;
        }
        int score = (int) Math.round(earned / total * 100);
        return new MatchResult(score, List.copyOf(reasons));
    }

    /**
     * 희망지역들 중 공고 위치와 가장 잘 맞는 비율.
     * 한 지역: 시/군/구까지 지정했으면 둘 다 일치 1.0 / 시/도만 일치 0.5, 시/도만 지정했으면 시/도 일치 1.0.
     */
    private double bestRegionRatio(JobSeekerProfile s, JobPosting p) {
        double best = 0.0;
        for (DesiredRegion r : s.getDesiredRegions()) {
            if (!r.getSido().equals(p.getSido())) {
                continue;
            }
            double ratio = r.hasSigungu()
                    ? (r.getSigungu().equals(p.getSigungu()) ? 1.0 : 0.5)
                    : 1.0;
            if (ratio >= 1.0) {
                return 1.0;
            }
            best = Math.max(best, ratio);
        }
        return best;
    }

    /** 협의(NEGOTIABLE)는 어느 쪽이든 유연한 것으로 보고 일치로 처리. */
    private boolean workTypeMatches(WorkType desired, WorkType posting) {
        return desired == posting || desired == WorkType.NEGOTIABLE || posting == WorkType.NEGOTIABLE;
    }

    /** 급여유형이 다르면(시급 vs 월급 등) 비교 불가로 0. 같으면 희망액 충족 1.0, 미달이면 비율. */
    private double payRatio(JobSeekerProfile s, JobPosting p) {
        if (s.getDesiredPayType() != p.getPayType() || p.getPayAmount() == null || p.getPayAmount() <= 0) {
            return 0.0;
        }
        double ratio = (double) p.getPayAmount() / s.getDesiredMinPay();
        return Math.min(ratio, 1.0);
    }
}
