package com.carematch.config;

import com.carematch.jobposting.domain.CareGrade;
import com.carematch.jobposting.domain.CognitiveStatus;
import com.carematch.jobposting.domain.ElderGender;
import com.carematch.jobposting.domain.EmploymentType;
import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobType;
import com.carematch.jobposting.domain.MealStatus;
import com.carematch.jobposting.domain.MobilityStatus;
import com.carematch.jobposting.domain.PayType;
import com.carematch.jobposting.domain.WorkSchedule;
import com.carematch.jobposting.domain.WorkType;
import com.carematch.jobposting.repository.JobPostingRepository;
import com.carematch.member.domain.CareTask;
import com.carematch.member.domain.DesiredRegion;
import com.carematch.member.domain.EducationLevel;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.FacilityType;
import com.carematch.member.domain.Gender;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import com.carematch.member.repository.FacilityProfileRepository;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * local 프로필 전용 — 구인공고/인재(구직자) 더미 데이터.
 * LocalDataInitializer(약관/관리자/공지/FAQ)와 분리해 둔다 — 이쪽이 훨씬 크고,
 * 그쪽은 회원가입 검증에 꼭 필요한 최소 시드라 성격이 다르다.
 *
 * 목적: 구인공고/인재정보/내주변일자리 목록이 로컬에서 빈 화면으로 뜨는 문제 해결.
 * 17개 시/도 전체에 공고·인재를 고르게 분산해서, 어떤 지역/필터로 검색해도 결과가 나오게 한다.
 * 완전 무작위 대신 인덱스 순환(idx % length)으로 결정적으로 생성한다 — 재현 가능하고 리뷰하기 쉽다.
 *
 * ⚠️ 이 시더는 @Profile("local") 이라 로컬 개발 환경에서만 실행된다. 운영(Render)이 이 프로필로
 * 떠 있다면(과거 세션에서 그런 정황이 있었다) 이 더미 데이터도 운영에 그대로 반영되니 주의.
 */
@Slf4j
@Configuration
@Profile("local")
@RequiredArgsConstructor
public class DummyMarketplaceSeeder {

    private final MemberRepository memberRepository;
    private final FacilityProfileRepository facilityProfileRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final JobPostingRepository jobPostingRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String SEED_PASSWORD = "Seed1234!";

    /** [시/도, 대표 시/군/구 2곳] — frontend/src/data/filters.ts 의 SIDO_OPTIONS/DISTRICT_OPTIONS 문자열과 정확히 일치시킨다. */
    private static final String[][] REGIONS = {
            {"서울특별시", "강남구", "마포구"},
            {"경기도", "수원시 영통구", "성남시 분당구"},
            {"인천광역시", "연수구", "남동구"},
            {"부산광역시", "해운대구", "동래구"},
            {"대구광역시", "수성구", "달서구"},
            {"대전광역시", "유성구", "서구"},
            {"광주광역시", "북구", "광산구"},
            {"울산광역시", "남구", "중구"},
            {"세종특별자치시", "도담동", "한솔동"},
            {"강원특별자치도", "춘천시", "원주시"},
            {"충청북도", "청주시 흥덕구", "충주시"},
            {"충청남도", "천안시 서북구", "아산시"},
            {"전북특별자치도", "전주시 덕진구", "익산시"},
            {"전라남도", "여수시", "순천시"},
            {"경상북도", "포항시 남구", "구미시"},
            {"경상남도", "창원시 성산구", "김해시"},
            {"제주특별자치도", "제주시", "서귀포시"},
    };

    /**
     * REGIONS 와 같은 순서의 [위도, 경도] — 대표 도시 중심 좌표. "내 주변 일자리"(반경 검색)는
     * 위경도가 있는 공고만 대상이라, 없으면 시드해도 결과가 0건이 된다.
     */
    private static final double[][] REGION_COORDS = {
            {37.5665, 126.9780}, // 서울
            {37.2636, 127.0286}, // 경기(수원)
            {37.4563, 126.7052}, // 인천
            {35.1796, 129.0756}, // 부산
            {35.8714, 128.6014}, // 대구
            {36.3504, 127.3845}, // 대전
            {35.1595, 126.8526}, // 광주
            {35.5384, 129.3114}, // 울산
            {36.4801, 127.2890}, // 세종
            {37.8813, 127.7298}, // 강원(춘천)
            {36.6424, 127.4890}, // 충북(청주)
            {36.8151, 127.1139}, // 충남(천안)
            {35.8242, 127.1480}, // 전북(전주)
            {34.7604, 127.6622}, // 전남(여수)
            {36.0190, 129.3435}, // 경북(포항)
            {35.2280, 128.6811}, // 경남(창원)
            {33.4996, 126.5312}, // 제주
    };

    private static final String[] FACILITY_NAME_WORDS = {
            "햇살", "푸른", "다솜", "은빛", "행복", "사랑", "든든", "따뜻한", "온누리", "참사랑",
            "늘봄", "정성", "효담", "희망", "새순",
    };

    private static final String[] SURNAMES = {
            "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
            "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍",
    };
    private static final String[] GIVEN_NAMES = {
            "민준", "서연", "예준", "지우", "도윤", "수아", "시우", "하은", "주원", "지민",
            "지호", "채원", "건우", "다은", "우진", "서윤", "선우", "지안", "현우", "소율",
    };

    private static final Map<JobType, String> JOB_TYPE_LABEL = Map.ofEntries(
            Map.entry(JobType.CAREGIVER, "요양보호사"),
            Map.entry(JobType.CARE_ATTENDANT, "간병인"),
            Map.entry(JobType.NURSE_AIDE, "간호조무사"),
            Map.entry(JobType.SOCIAL_WORKER, "사회복지사"),
            Map.entry(JobType.LIFE_SUPPORT, "생활지원사"),
            Map.entry(JobType.HOUSEKEEPER, "가사도우미"),
            Map.entry(JobType.ETC, "요양인력")
    );

    private static final Map<FacilityType, String> FACILITY_TYPE_SUFFIX = Map.ofEntries(
            Map.entry(FacilityType.VISITING_CARE, "방문요양센터"),
            Map.entry(FacilityType.NURSING_HOME, "요양원"),
            Map.entry(FacilityType.DAY_NIGHT_CARE, "주야간보호센터"),
            Map.entry(FacilityType.COMMUNITY_CARE, "재가복지센터"),
            Map.entry(FacilityType.NURSING_HOSPITAL, "요양병원"),
            Map.entry(FacilityType.ETC, "케어센터")
    );

    @Bean
    ApplicationRunner seedMarketplaceData() {
        return args -> {
            if (jobPostingRepository.count() > 0) {
                log.info("[seed] 구인공고 더미 데이터 이미 존재 — 스킵");
                return;
            }

            List<FacilityProfile> facilities = seedFacilities();
            int postingCount = seedJobPostings(facilities);
            int seekerCount = seedJobSeekers();

            log.info("[seed] 더미 마켓플레이스 데이터 생성 완료 — 시설 {}개 / 공고 {}건 / 인재 {}명",
                    facilities.size(), postingCount, seekerCount);
        };
    }

    // ---------------------------------------------------------------------
    // 시설회원 — 지역당 1개, 전부 승인(APPROVED) 상태로 생성해 공고 소유자로 쓴다.
    // ---------------------------------------------------------------------
    private List<FacilityProfile> seedFacilities() {
        List<FacilityProfile> facilities = new ArrayList<>();
        FacilityType[] facilityTypes = FacilityType.values();

        for (int i = 0; i < REGIONS.length; i++) {
            String sido = REGIONS[i][0];
            FacilityType type = facilityTypes[i % facilityTypes.length];
            String name = sido.substring(0, 2) + " " + FACILITY_NAME_WORDS[i % FACILITY_NAME_WORDS.length]
                    + " " + FACILITY_TYPE_SUFFIX.get(type);

            Member member = memberRepository.save(Member.builder()
                    .loginId("seed_fac_" + i)
                    .password(passwordEncoder.encode(SEED_PASSWORD))
                    .email("seed_fac_" + i + "@carematch.local")
                    .name(SURNAMES[i % SURNAMES.length] + "원장")
                    .phone(String.format("010-90%02d-00%02d", i, i))
                    .role(Role.FACILITY)
                    .status(MemberStatus.ACTIVE)
                    .verified(true)
                    .build());

            FacilityProfile facility = facilityProfileRepository.save(FacilityProfile.builder()
                    .member(member)
                    .facilityName(name)
                    .facilityType(type)
                    .businessRegistrationNumber(String.format("900%02d%05d", i, i))
                    .businessLicenseFileKey("seed/business-license/" + i + ".png")
                    .build());
            facility.approve(LocalDateTime.now());
            facilities.add(facilityProfileRepository.save(facility));
        }
        return facilities;
    }

    // ---------------------------------------------------------------------
    // 구인공고 — 지역(17)마다 대표 시군구 2곳 × 3건 = 약 100건. 직종/근무형태/급여/어르신
    // 정보 등 모든 축을 인덱스 순환으로 고르게 분산한다.
    // ---------------------------------------------------------------------
    private int seedJobPostings(List<FacilityProfile> facilities) {
        JobType[] jobTypes = JobType.values();
        WorkType[] workTypes = WorkType.values();
        WorkSchedule[] schedules = WorkSchedule.values();
        EmploymentType[] employmentTypes = EmploymentType.values();
        PayType[] payTypes = PayType.values();
        CareGrade[] careGrades = CareGrade.values();
        ElderGender[] elderGenders = ElderGender.values();
        MobilityStatus[] mobilityStatuses = MobilityStatus.values();
        MealStatus[] mealStatuses = MealStatus.values();
        CognitiveStatus[] cognitiveStatuses = CognitiveStatus.values();
        String[] workDaysOptions = {"월~금", "월~토", "주5일 (협의)", "화·목·토", "매일"};

        int idx = 0;
        for (int r = 0; r < REGIONS.length; r++) {
            String[] region = REGIONS[r];
            String sido = region[0];
            double baseLat = REGION_COORDS[r][0];
            double baseLng = REGION_COORDS[r][1];
            for (int d = 1; d <= 2; d++) {
                String sigungu = region[d];
                for (int k = 0; k < 3; k++) {
                    // 대표 좌표에서 ±0.01~0.05도(약 1~5km) 결정적으로 흩뿌려 한 점에 안 겹치게 한다.
                    double latitude = baseLat + ((idx % 5) - 2) * 0.02;
                    double longitude = baseLng + ((idx % 7) - 3) * 0.02;
                    JobType jobType = jobTypes[idx % jobTypes.length];
                    WorkType workType = workTypes[idx % workTypes.length];
                    WorkSchedule schedule = workType == WorkType.LIVE_IN
                            ? null : schedules[idx % schedules.length];
                    EmploymentType employmentType = employmentTypes[idx % employmentTypes.length];
                    PayType payType = payTypes[idx % payTypes.length];
                    FacilityProfile facility = facilities.get(idx % facilities.size());

                    ExposureType exposureType = idx % 15 == 0 ? ExposureType.SPECIAL
                            : idx % 11 == 0 ? ExposureType.PREMIUM
                            : ExposureType.NORMAL;

                    JobPosting posting = JobPosting.builder()
                            .facilityProfile(facility)
                            .jobType(jobType)
                            .title(sigungu + " " + JOB_TYPE_LABEL.get(jobType) + " 구인합니다 (" + (idx + 1) + ")")
                            .description(facility.getFacilityName() + "에서 함께 일하실 " + JOB_TYPE_LABEL.get(jobType)
                                    + "님을 모십니다. 초보자도 친절히 안내해 드립니다.")
                            .workType(workType)
                            .workSchedule(schedule)
                            .employmentType(employmentType)
                            .workDays(workDaysOptions[idx % workDaysOptions.length])
                            .workStartTime(LocalTime.of(8 + idx % 4, 0))
                            .workEndTime(LocalTime.of(17 + idx % 4, 0))
                            .payType(payType)
                            .payAmount(payAmountFor(payType, idx))
                            .recruitCount(1 + idx % 3)
                            .deadline(LocalDate.now().plusDays(20 + idx % 45))
                            .sido(sido)
                            .sigungu(sigungu)
                            .latitude(latitude)
                            .longitude(longitude)
                            .careGrade(careGrades[idx % careGrades.length])
                            .elderGender(elderGenders[idx % elderGenders.length])
                            .mobilityStatus(mobilityStatuses[idx % mobilityStatuses.length])
                            .mealStatus(mealStatuses[idx % mealStatuses.length])
                            .cognitiveStatus(cognitiveStatuses[idx % cognitiveStatuses.length])
                            .minCareerYears(idx % 4 == 0 ? 1 + idx % 3 : null)
                            .exposureType(exposureType)
                            .build();

                    if (exposureType != ExposureType.NORMAL) {
                        posting.applyExposure(14);
                    }
                    jobPostingRepository.save(posting);
                    idx++;
                }
            }
        }
        return idx;
    }

    private static int payAmountFor(PayType payType, int idx) {
        return switch (payType) {
            case HOURLY -> 11000 + (idx % 6) * 500;
            case DAILY -> 85000 + (idx % 6) * 5000;
            case MONTHLY -> 2000000 + (idx % 8) * 100000;
        };
    }

    // ---------------------------------------------------------------------
    // 구직자(인재) — 지역(17)마다 4명 = 약 68명. 희망직종/성별/경력/학력/자격요건 등을
    // 인덱스 순환으로 고르게 분산한다.
    // ---------------------------------------------------------------------
    private int seedJobSeekers() {
        JobType[] jobTypes = JobType.values();
        WorkType[] workTypes = WorkType.values();
        WorkSchedule[] schedules = WorkSchedule.values();
        PayType[] payTypes = PayType.values();
        EmploymentType[] employmentTypes = EmploymentType.values();
        Gender[] genders = Gender.values();
        EducationLevel[] educations = EducationLevel.values();
        CareTask[] tasks = CareTask.values();

        int idx = 0;
        for (String[] region : REGIONS) {
            String sido = region[0];
            for (int k = 0; k < 4; k++) {
                String sigungu = region[1 + k % 2];
                String name = SURNAMES[idx % SURNAMES.length] + GIVEN_NAMES[idx % GIVEN_NAMES.length];

                Member member = memberRepository.save(Member.builder()
                        .loginId("seed_js_" + idx)
                        .password(passwordEncoder.encode(SEED_PASSWORD))
                        .email("seed_js_" + idx + "@carematch.local")
                        .name(name)
                        .phone(String.format("010-80%02d-%04d", idx / 100, idx % 10000))
                        .role(Role.JOBSEEKER)
                        .status(MemberStatus.ACTIVE)
                        .verified(true)
                        .build());

                JobSeekerProfile profile = jobSeekerProfileRepository.save(JobSeekerProfile.builder()
                        .member(member)
                        .employmentStatus(idx % 5 == 0 ? EmploymentStatus.EMPLOYED : EmploymentStatus.SEEKING)
                        .residence(sido + " " + sigungu)
                        .introduction("성실하고 책임감 있게 어르신을 모시겠습니다.")
                        .build());

                JobType desiredJobType = jobTypes[idx % jobTypes.length];
                profile.updateDesiredConditions(new JobSeekerProfile.DesiredConditions(
                        desiredJobType,
                        workTypes[idx % workTypes.length],
                        schedules[idx % schedules.length],
                        List.of(new DesiredRegion(sido, sigungu)),
                        payTypes[idx % payTypes.length],
                        1_800_000 + (idx % 6) * 150_000));

                profile.updateDetails(new JobSeekerProfile.ProfileDetails(
                        genders[idx % genders.length],
                        1960 + idx % 35,
                        null,
                        idx % 12,
                        educations[idx % educations.length],
                        JOB_TYPE_LABEL.get(desiredJobType) + " 경력 " + (idx % 12) + "년",
                        Set.of(tasks[idx % tasks.length], tasks[(idx + 3) % tasks.length]),
                        Set.of(employmentTypes[idx % employmentTypes.length]),
                        null, null, null));

                jobSeekerProfileRepository.save(profile);
                idx++;
            }
        }
        return idx;
    }
}
