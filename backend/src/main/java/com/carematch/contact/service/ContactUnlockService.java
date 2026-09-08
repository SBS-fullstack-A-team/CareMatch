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
import com.carematch.point.PointService;
import com.carematch.point.StubPointService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;

/**
 * 연락처 열람(마스킹 → 이력 확인 → (스텁)차감 → 언마스크) 흐름.
 *
 * 범위: 이번 작업은 아래 4단계의 "구조"까지다.
 *   1) 대상 상태 검증(EMPLOYED 면 열람 자체 차단) — 포인트와 무관, 지금 구현
 *   2) 이미 열람 이력 있으면 PointService 호출 없이 무료 언마스크
 *   3) 없으면 PointService(스텁)로 차감 가능 여부 확인 "자리"
 *   4) 성공 시 이력 저장 후 언마스크 응답
 * 범위 밖: 포인트 잔액 관리/충전/동시성 락 (PointService 구현체 교체로 확장)
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

        // 3) 최초 열람 → (스텁) 포인트 차감 자리. 지금은 항상 성공 반환.
        int cost = StubPointService.CONTACT_UNLOCK_COST;
        boolean deducted = pointService.deduct(
                facilityMemberId, cost, "CONTACT_UNLOCK:jobSeekerProfileId=" + jobSeekerProfileId);
        if (!deducted) {
            throw new BusinessException(ErrorCode.POINT_CHARGE_FAILED);
        }

        // 4) 이력 저장 후 언마스크 응답
        Member facilityMember = memberRepository.findById(facilityMemberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
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
        if (unlockHistoryRepository
                .existsByFacilityMemberIdAndJobSeekerProfileId(facilityMemberId, jobSeekerProfileId)) {
            return;
        }
        Member facilityMember = memberRepository.findById(facilityMemberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        JobSeekerProfile profile = jobSeekerProfileRepository.findById(jobSeekerProfileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "jobSeekerProfile " + jobSeekerProfileId));
        try {
            unlockHistoryRepository.save(ContactUnlockHistory.builder()
                    .facilityMember(facilityMember)
                    .jobSeekerProfile(profile)
                    .pointsSpent(0)
                    .build());
            log.info("[ContactUnlock] 지원으로 무료 열람 권한 부여 facilityMemberId={} profileId={}",
                    facilityMemberId, jobSeekerProfileId);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // 동시 요청으로 이미 생성됨 — 무시
        }
    }
}
