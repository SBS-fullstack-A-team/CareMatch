package com.carematch.member.dto;

import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.JobSeekerProfile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 인재정보 검색 요청/응답 DTO. 검색·상세는 승인된 시설회원 / 관리자만.
 */
public final class TalentSearchDtos {

    private TalentSearchDtos() {
    }

    /**
     * 인재 검색 필터. 전부 선택.
     * 지역·직종·근무형태·급여는 구직자가 설정한 <b>희망조건</b> 기준으로 매칭한다
     * (희망조건 미설정 구직자는 해당 필터에서 제외된다).
     */
    public record SearchCondition(
            JobType desiredJobType,
            WorkType desiredWorkType,
            String sido,
            String sigungu,
            PayType payType,
            /** 구직자 희망 최소급여가 이 값 이하인 인재만. */
            Integer payMax,
            /** null 또는 true 면 구직중(SEEKING)만. false 면 취업완료 포함. */
            Boolean seekingOnly,
            /** 최근 N일 이내에 프로필이 갱신된 인재만. */
            Integer updatedWithinDays,
            /** LATEST(기본, 최근 갱신순). */
            String sort
    ) {
    }

    /** 인재 목록 카드. */
    public record TalentSummary(
            Long profileId,
            Long memberId,
            String name,
            String employmentStatus,
            String desiredJobType,
            String desiredWorkType,
            String desiredSido,
            String desiredSigungu,
            String desiredPayType,
            Integer desiredMinPay,
            List<String> certificateNames,
            /** "마지막 확인일" 표기용. */
            LocalDateTime updatedAt,
            /** 이 시설의 OPEN 공고들 중 최고 매칭 점수. 시설 아님 / 공고 없음 / 인재 희망조건 미설정이면 null. */
            Integer matchScore
    ) {
        public static TalentSummary from(JobSeekerProfile p, List<String> certificateNames, Integer matchScore) {
            return new TalentSummary(
                    p.getId(), p.getMember().getId(), p.getMember().getName(),
                    p.getEmploymentStatus().name(),
                    name(p.getDesiredJobType()), name(p.getDesiredWorkType()),
                    p.getDesiredSido(), p.getDesiredSigungu(),
                    name(p.getDesiredPayType()), p.getDesiredMinPay(),
                    certificateNames, p.getUpdatedAt(), matchScore);
        }

        private static String name(Enum<?> e) {
            return e == null ? null : e.name();
        }
    }
}
