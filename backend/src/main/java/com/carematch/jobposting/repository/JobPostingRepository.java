package com.carematch.jobposting.repository;

import com.carematch.jobposting.domain.ExposureType;
import com.carematch.jobposting.domain.JobPosting;
import com.carematch.jobposting.domain.JobPostingStatus;
import com.carematch.jobposting.domain.JobType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 구인공고 CRUD + 목록/검색.
 * 다중조건 동적 검색은 JpaSpecificationExecutor + JobPostingSpecs 로 처리(추가 의존성 없이 Spring Data 범위).
 */
public interface JobPostingRepository
        extends JpaRepository<JobPosting, Long>, JpaSpecificationExecutor<JobPosting> {

    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    Optional<JobPosting> findWithFacilityById(Long id);

    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    Page<JobPosting> findByStatus(JobPostingStatus status, Pageable pageable);

    /** "소페셜 채용정보" 상단 노출용 — 만료 안 된 SPECIAL 공고 상위 N. */
    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    List<JobPosting> findTop3ByStatusAndExposureTypeAndExposureExpiredAtAfterOrderByCreatedAtDesc(
            JobPostingStatus status, ExposureType exposureType, LocalDateTime now);

    /**
     * 비슷한 공고 — 같은 시군구 + 직종, 자기 자신 제외, OPEN, 상위 6.
     * exposure_priority(int) DESC → 최신순. 만료 강등은 스케줄러가 처리하므로 이 컬럼만 보면 된다.
     */
    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    List<JobPosting> findTop6ByStatusAndSigunguAndJobTypeAndIdNotOrderByExposurePriorityDescCreatedAtDesc(
            JobPostingStatus status, String sigungu, JobType jobType, Long excludeId);

    /**
     * 노출 옵션이 만료된 공고를 NORMAL(우선순위 0) 로 강등. 스케줄러가 주기적으로 호출.
     * @return 강등된 행 수
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            update JobPosting jp
               set jp.exposureType = com.carematch.jobposting.domain.ExposureType.NORMAL,
                   jp.exposurePriority = 0
             where jp.exposureType <> com.carematch.jobposting.domain.ExposureType.NORMAL
               and jp.exposureExpiredAt is not null
               and jp.exposureExpiredAt < :now
            """)
    int demoteExpiredExposures(@Param("now") LocalDateTime now);

    /** 이 시설(회원 기준)이 등록한 특정 상태의 공고 전부. 인재 ↔ 우리 공고 매칭 계산용. */
    List<JobPosting> findByFacilityProfileMemberIdAndStatus(Long facilityMemberId, JobPostingStatus status);

    /**
     * "내 주변 일자리" — 위경도 바운딩 박스 안의 OPEN 공고 (최신순, {@code pageable} 로 상한).
     * 정밀 반경 필터·정렬은 서비스에서 Haversine 으로 처리한다 (DB 벤더 함수 미사용).
     * 밀집 지역 + 넓은 반경에서 결과 폭주를 막으려고 SQL 단에서 먼저 개수를 제한한다.
     */
    @EntityGraph(attributePaths = {"facilityProfile", "facilityProfile.member"})
    @Query("""
            select jp from JobPosting jp
            where jp.status = com.carematch.jobposting.domain.JobPostingStatus.OPEN
              and jp.latitude is not null and jp.longitude is not null
              and jp.latitude between :minLat and :maxLat
              and jp.longitude between :minLng and :maxLng
            order by jp.createdAt desc
            """)
    List<JobPosting> findOpenWithinBoundingBox(@Param("minLat") double minLat, @Param("maxLat") double maxLat,
                                               @Param("minLng") double minLng, @Param("maxLng") double maxLng,
                                               Pageable pageable);
}
