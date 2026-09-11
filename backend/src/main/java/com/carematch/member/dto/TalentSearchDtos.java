package com.carematch.member.dto;

import com.carematch.certificate.domain.CertificateType;
import com.carematch.common.masking.MaskingUtil;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
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
            /** 희망 직종 다중(OR). 좌측 필터 체크박스가 여러 직종을 동시에 선택할 수 있다. */
            List<JobType> desiredJobTypes,
            WorkType desiredWorkType,
            /** 희망 근무 시간대 다중(OR). 미설정(null desiredWorkSchedule) 구직자는 제외. docs/ENUM_MAPPING.md §2 */
            List<WorkSchedule> desiredWorkSchedules,
            /** 희망지역 시·도 다중(OR). 좌측 필터 체크박스가 여러 시·도를 동시에 선택할 수 있다. */
            List<String> sidos,
            String sigungu,
            /** 희망 급여유형 다중(OR). */
            List<PayType> payTypes,
            /** 구직자 희망 최소급여가 이 값 이하인 인재만. */
            Integer payMax,
            Gender gender,
            /** 경력 구간 다중(OR). 프론트 신입/1~3/3~5/5년+ 체크박스와 1:1. */
            List<CareerBucket> careerBuckets,
            /** 이 업무들 중 하나라도 가능한 인재. */
            List<CareTask> availableTasks,
            /** 이 고용형태들 중 하나라도 희망하는 인재. */
            List<EmploymentType> desiredEmploymentTypes,
            /** 이 자격증 종류 중 하나라도 보유한 인재 (certificate_type 일치, 상태 무관). docs/ENUM_MAPPING.md §5 */
            List<CertificateType> certificateTypes,
            /** null 또는 true 면 구직중(SEEKING)만. false 면 취업완료 포함. */
            Boolean seekingOnly,
            /** 최근 N일 이내에 프로필이 갱신된 인재만. */
            Integer updatedWithinDays,
            /** LATEST(기본, 최근 갱신순) / CAREER_DESC / CAREER_ASC. */
            String sort
    ) {
        /** 같은 조건에서 특정 필터 축만 비운 사본을 만든다 (좌측 필터 옵션별 결과 건수 계산용). */
        public SearchCondition withoutSidos() {
            return new SearchCondition(desiredJobTypes, desiredWorkType, desiredWorkSchedules, null, sigungu,
                    payTypes, payMax, gender, careerBuckets, availableTasks, desiredEmploymentTypes,
                    certificateTypes, seekingOnly, updatedWithinDays, sort);
        }

        public SearchCondition withoutDesiredJobTypes() {
            return new SearchCondition(null, desiredWorkType, desiredWorkSchedules, sidos, sigungu,
                    payTypes, payMax, gender, careerBuckets, availableTasks, desiredEmploymentTypes,
                    certificateTypes, seekingOnly, updatedWithinDays, sort);
        }

        public SearchCondition withoutDesiredWorkSchedules() {
            return new SearchCondition(desiredJobTypes, desiredWorkType, null, sidos, sigungu,
                    payTypes, payMax, gender, careerBuckets, availableTasks, desiredEmploymentTypes,
                    certificateTypes, seekingOnly, updatedWithinDays, sort);
        }

        public SearchCondition withoutCareerBuckets() {
            return new SearchCondition(desiredJobTypes, desiredWorkType, desiredWorkSchedules, sidos, sigungu,
                    payTypes, payMax, gender, null, availableTasks, desiredEmploymentTypes,
                    certificateTypes, seekingOnly, updatedWithinDays, sort);
        }
    }

    /**
     * 좌측 필터 패널의 옵션별 결과 인원수 ({@code GET /api/jobseekers/facets}).
     * 각 맵은 그 축 자신의 선택은 제외한 나머지 조건으로 센다 (JobPostingDtos.FacetsResponse 와 동일 규칙).
     * 자격증 축은 별도 관계(Certificate) 조인이 필요해 이번 범위에서는 제공하지 않는다 — 체크박스는
     * 그대로 동작하고 옆 숫자만 비어 있다.
     */
    public record FacetsResponse(
            /** key = sido 전체 표기(예: "서울특별시") */
            java.util.Map<String, Long> sido,
            /** key = JobType enum name */
            java.util.Map<String, Long> desiredJobType,
            /** key = WorkSchedule enum name */
            java.util.Map<String, Long> desiredWorkSchedule,
            /** key = CareerBucket enum name (ENTRY/Y1_3/Y3_5/Y5_PLUS) */
            java.util.Map<String, Long> careerBucket
    ) {
    }

    /**
     * 경력 구간. 프론트 CAREER_OPTIONS(신입 / 1~3년 / 3~5년 / 5년 이상)와 1:1.
     * {@code [minInclusive, maxExclusive)} 연차 범위. maxExclusive 가 null 이면 상한 없음.
     */
    public enum CareerBucket {
        ENTRY(0, 1),
        Y1_3(1, 3),
        Y3_5(3, 5),
        Y5_PLUS(5, null);

        private final int minInclusive;
        private final Integer maxExclusive;

        CareerBucket(int minInclusive, Integer maxExclusive) {
            this.minInclusive = minInclusive;
            this.maxExclusive = maxExclusive;
        }

        public int minInclusive() {
            return minInclusive;
        }

        public Integer maxExclusive() {
            return maxExclusive;
        }
    }

    /** 인재 목록 카드. 승인 시설회원 / 관리자만 조회. */
    public record TalentSummary(
            Long profileId,
            Long memberId,
            /** 마스킹된 이름(홍*동). 목록에는 실명을 싣지 않는다 — 상세에서 연락처 열람 시 언마스크. */
            String name,
            String employmentStatus,
            String gender,
            Integer age,
            String photoUrl,
            Integer careerYears,
            String education,
            String desiredJobType,
            String desiredWorkType,
            String desiredWorkSchedule,
            List<RegionDto> desiredRegions,
            String desiredPayType,
            Integer desiredMinPay,
            String desiredWorkDays,
            LocalTime desiredWorkStartTime,
            LocalTime desiredWorkEndTime,
            List<String> certificateNames,
            /** certificateNames 와 같은 순서 대응. enum name(docs/ENUM_MAPPING.md §5) — 필터·표시용. */
            List<String> certificateTypes,
            /** "마지막 확인일" 표기용. */
            java.time.LocalDateTime updatedAt,
            /** 이 시설의 OPEN 공고들 중 최고 매칭 점수. 시설 아님 / 공고 없음 / 인재 희망조건 미설정이면 null. */
            Integer matchingScore
    ) {
        public static TalentSummary from(JobSeekerProfile p, List<String> certificateNames,
                                         List<String> certificateTypes, Integer matchingScore) {
            Integer age = p.getBirthYear() == null ? null : Year.now().getValue() - p.getBirthYear();
            return new TalentSummary(
                    p.getId(), p.getMember().getId(), MaskingUtil.maskName(p.getMember().getName()),
                    p.getEmploymentStatus().name(),
                    name(p.getGender()), age, p.getPhotoUrl(), p.getCareerYears(), name(p.getEducation()),
                    name(p.getDesiredJobType()), name(p.getDesiredWorkType()),
                    name(p.getDesiredWorkSchedule()),
                    p.getDesiredRegions().stream().map(RegionDto::from).toList(),
                    name(p.getDesiredPayType()), p.getDesiredMinPay(),
                    p.getDesiredWorkDays(), p.getDesiredWorkStartTime(), p.getDesiredWorkEndTime(),
                    certificateNames, certificateTypes, p.getUpdatedAt(), matchingScore);
        }

        private static String name(Enum<?> e) {
            return e == null ? null : e.name();
        }
    }
}
