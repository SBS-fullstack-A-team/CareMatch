package com.carematch.contact.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.contact.domain.ContactUnlockHistory;
import com.carematch.contact.dto.ContactUnlockResponse;
import com.carematch.contact.repository.ContactUnlockHistoryRepository;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.member.repository.MemberRepository;
import com.carematch.point.PointPolicy;
import com.carematch.point.PointService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;

/**
 * 연락처 열람(마스킹 → 이력 확인 → 차감 → 언마스크) 흐름.
 *
 * 흐름:
 *   1) 대상 상태 검증(EMPLOYED 면 열람 자체 차단) — 포인트/이력과 무관
 *   2) 시설 회원 row 에 비관적 락(findByIdForUpdate) — 같은 시설의 동시 열람 요청을 여기서부터
 *      직렬화해서, "이력 확인 → 차감 → 이력 저장" 전체를 하나의 경쟁 없는 구간으로 만든다
 *   3) 이미 열람 이력 있으면 PointService 호출 없이 무료 언마스크
 *   4) 없으면 PointService 로 실제 잔액 차감(부족하면 402)
 *   5) 성공 시 이력 저장 후 언마스크 응답
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContactUnlockService {

    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final MemberRepository memberRepository;
    private final ContactUnlockHistoryRepository unlockHistoryRepository;
    private final PointService pointService;

    /**
     * 연락처 열람 요청. 시설회원 승인 여부는 FacilityApprovalInterceptor 가 이미 검증했다는 전제.
     */
    @Transactional
    public ContactUnlockResponse unlock(Long facilityMemberId, Long jobSeekerProfileId) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findById(jobSeekerProfileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobSeekerProfile " + jobSeekerProfileId));

        // 1) 취업완료 구직자는 열람 자체 차단 (포인트/이력과 무관한 비즈니스 규칙)
        if (profile.isEmployed()) {
            throw new BusinessException(ErrorCode.CONTACT_UNLOCK_BLOCKED_EMPLOYED, "profileId=" + jobSeekerProfileId);
        }

        Member unmaskedOwner = profile.getMember();

        // 시설 회원 row 에 비관적 락을 걸어 "이력 확인 → 차감 → 이력 저장"을 하나의 락 구간으로
        // 묶는다. 같은 시설이 같은 인재를 동시에 두 번 열람 요청해도, 두 번째 요청은 첫 번째
        // 트랜잭션이 커밋될 때까지 여기서 대기했다가 "이미 이력이 있음"을 보고 무료로 처리된다.
        // (unique 제약 위반을 catch 해서 계속 진행하는 방식은 Hibernate/Postgres 양쪽 다 해당
        //  트랜잭션을 rollback-only 로 표시해버려서, 이후 정상 커밋 시 UnexpectedRollbackException
        //  이 터진다 — 그래서 애초에 경쟁이 안 생기도록 락으로 막는다.)
        Member facilityMember = memberRepository.findByIdForUpdate(facilityMemberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 2) 이미 열람한 적 있으면 무료로 언마스크 (PointService 호출 안 함)
        var existing = unlockHistoryRepository
                .findByFacilityMemberIdAndJobSeekerProfileId(facilityMemberId, jobSeekerProfileId);
        if (existing.isPresent()) {
            ContactUnlockHistory h = existing.get();
            log.info("[ContactUnlock] 재열람(무료) facilityMemberId={} profileId={}", facilityMemberId, jobSeekerProfileId);
            return new ContactUnlockResponse(
                    jobSeekerProfileId,
                    unmaskedOwner.getPhone(),
                    profile.getResidence(),
                    true, 0,
                    h.getUnlockedAt().atZone(ZoneId.systemDefault()).toOffsetDateTime());
        }

        // 3) 최초 열람 → 실제 포인트 차감 (위에서 이미 락을 잡아둔 같은 row 라 재조회만 한다)
        int cost = PointPolicy.CONTACT_UNLOCK_COST;
        boolean deducted = pointService.deduct(
                facilityMemberId, cost, "CONTACT_UNLOCK:jobSeekerProfileId=" + jobSeekerProfileId);
        if (!deducted) {
            throw new BusinessException(ErrorCode.POINT_CHARGE_FAILED);
        }

        // 4) 이력 저장 후 언마스크 응답
        ContactUnlockHistory saved = unlockHistoryRepository.save(ContactUnlockHistory.builder()
                .facilityMember(facilityMember)
                .jobSeekerProfile(profile)
                .pointsSpent(cost)
                .build());

        log.info("[ContactUnlock] 최초 열람 facilityMemberId={} profileId={} cost={}", facilityMemberId, jobSeekerProfileId, cost);
        return new ContactUnlockResponse(
                jobSeekerProfileId,
                unmaskedOwner.getPhone(),
                profile.getResidence(),
                false, cost,
                saved.getUnlockedAt().atZone(ZoneId.systemDefault()).toOffsetDateTime());
    }

    /** 현재 요청자가 해당 프로필 연락처를 이미 열람했는지. */
    @Transactional(readOnly = true)
    public boolean hasUnlocked(Long facilityMemberId, Long jobSeekerProfileId) {
        return unlockHistoryRepository
                .existsByFacilityMemberIdAndJobSeekerProfileId(facilityMemberId, jobSeekerProfileId);
    }

    /**
     * 포인트 차감 없이 열람 권한을 부여한다 (0P 이력 저장). 이미 있으면 아무것도 안 함.
     * 구직자가 그 시설 공고에 <b>지원</b>하면 = 연락처 공개에 동의한 것으로 보고 호출한다.
     * (EMPLOYED 차단 규칙은 적용하지 않는다 — 본인이 지원한 것이므로.)
     */
    @Transactional
    public void grantFreeAccess(Long facilityMemberId, Long jobSeekerProfileId) {
        // unlock() 과 동일하게 시설 회원 row 를 락으로 먼저 잡아 확인→저장 구간의 경쟁을 없앤다
        // (unique 제약 위반을 catch 하고 계속 진행하면 트랜잭션이 rollback-only 로 표시돼
        //  나중 커밋 시점에 UnexpectedRollbackException 이 난다).
        Member facilityMember = memberRepository.findByIdForUpdate(facilityMemberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (unlockHistoryRepository
                .existsByFacilityMemberIdAndJobSeekerProfileId(facilityMemberId, jobSeekerProfileId)) {
            return;
        }
        JobSeekerProfile profile = jobSeekerProfileRepository.findById(jobSeekerProfileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "jobSeekerProfile " + jobSeekerProfileId));
        unlockHistoryRepository.save(ContactUnlockHistory.builder()
                .facilityMember(facilityMember)
                .jobSeekerProfile(profile)
                .pointsSpent(0)
                .build());
        log.info("[ContactUnlock] 지원으로 무료 열람 권한 부여 facilityMemberId={} profileId={}",
                facilityMemberId, jobSeekerProfileId);
    }
}
