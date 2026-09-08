package com.carematch.member.dto;

import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.member.domain.CareTask;
import com.carematch.member.domain.Gender;
import com.carematch.member.domain.JobSeekerProfile;

import java.time.LocalTime;
import java.time.Year;
import java.util.List;

/**
 * 인재정보 검색 요청/응답 DTO. 검색·상세는 승인된 시설회원 / 관리자만.
 */
public final class TalentSearchDtos {

    private TalentSearchDtos() {
    }

    /**
     * 인재 검색 필터. 전부 선택.
     * 지역·직종·근무형태·급여·고용형태·업무는 구직자가 설정한 <b>희망/가능</b> 값 기준으로 매칭한다
     * (해당 값 미설정 구직자는 그 필터에서 제외된다).
     */
    public record SearchCondition(
            JobType desiredJobType,
            WorkType desiredWorkType,
            String sido,
            String sigungu,
            PayType payType,
            /** 구직자 희망 최소급여가 이 값 이하인 인재만. */
            Integer payMax,
            Gender gender,
            /** 경력 연수가 이 값 이상인 인재만 (0/1/3 …). */
            Integer minCareerYears,
            /** 이 업무들 중 하나라도 가능한 인재. */
            List<CareTask> availableTasks,
            /** 이 고용형태들 중 하나라도 희망하는 인재. */
            List<EmploymentType> desiredEmploymentTypes,
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
            String gender,
            Integer age,
            String photoUrl,
            Integer careerYears,
            String education,
            String desiredJobType,
            String desiredWorkType,
            String desiredSido,
            String desiredSigungu,
            String desiredPayType,
            Integer desiredMinPay,
            String desiredWorkDays,
            LocalTime desiredWorkStartTime,
            LocalTime desiredWorkEndTime,
            List<String> certificateNames,
            /** "마지막 확인일" 표기용. */
            java.time.LocalDateTime updatedAt,
            /** 이 시설의 OPEN 공고들 중 최고 매칭 점수. 시설 아님 / 공고 없음 / 인재 희망조건 미설정이면 null. */
            Integer matchingScore
    ) {
        public static TalentSummary from(JobSeekerProfile p, List<String> certificateNames, Integer matchingScore) {
            Integer age = p.getBirthYear() == null ? null : Year.now().getValue() - p.getBirthYear();
            return new TalentSummary(
                    p.getId(), p.getMember().getId(), p.getMember().getName(),
                    p.getEmploymentStatus().name(),
                    name(p.getGender()), age, p.getPhotoUrl(), p.getCareerYears(), name(p.getEducation()),
                    name(p.getDesiredJobType()), name(p.getDesiredWorkType()),
                    p.getDesiredSido(), p.getDesiredSigungu(),
                    name(p.getDesiredPayType()), p.getDesiredMinPay(),
                    p.getDesiredWorkDays(), p.getDesiredWorkStartTime(), p.getDesiredWorkEndTime(),
                    certificateNames, p.getUpdatedAt(), matchingScore);
        }

        private static String name(Enum<?> e) {
            return e == null ? null : e.name();
        }
    }
}
