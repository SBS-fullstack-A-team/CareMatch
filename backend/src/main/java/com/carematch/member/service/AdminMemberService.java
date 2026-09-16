package com.carematch.member.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.AdminMemberSummary;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.member.repository.MemberRepository;
import com.carematch.member.repository.MemberSpecs;
import com.carematch.notification.domain.NotificationType;
import com.carematch.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** 관리자 회원관리 — 전체 회원 검색/조회, 인증구직자 마크 수동 부여/해제. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private final MemberRepository memberRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final NotificationService notificationService;

    public Page<AdminMemberSummary> search(Role role, MemberStatus status, String keyword, Pageable pageable) {
        Page<Member> members = memberRepository.findAll(MemberSpecs.search(role, status, keyword), pageable);

        List<Long> jobSeekerMemberIds = members.getContent().stream()
                .filter(m -> m.isRoleSelected() && m.getRole() == Role.JOBSEEKER)
                .map(Member::getId)
                .toList();
        Map<Long, Boolean> verifiedBadgeByMemberId = jobSeekerMemberIds.isEmpty()
                ? Map.of()
                : jobSeekerProfileRepository.findByMemberIdIn(jobSeekerMemberIds).stream()
                        .collect(Collectors.toMap(p -> p.getMember().getId(), JobSeekerProfile::isVerifiedBadge));

        return members.map(m -> AdminMemberSummary.from(m, verifiedBadgeByMemberId.get(m.getId())));
    }

    /**
     * 관리자가 정상 심사 절차(자격증·경력인증 승인 → 마크 신청 → 승인)를 거치지 않고
     * 구직회원에게 직접 "인증구직자" 마크를 부여/해제한다. (테스트 계정 준비 등 운영 편의용)
     */
    @Transactional
    public AdminMemberSummary setVerifiedBadge(Long memberId, boolean granted) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "member " + memberId));
        if (!member.isRoleSelected() || member.getRole() != Role.JOBSEEKER) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_JOBSEEKER, "member " + memberId);
        }
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));

        if (granted) {
            profile.grantBadge(LocalDateTime.now());
            notificationService.notify(memberId, NotificationType.BADGE_GRANTED,
                    "인증구직자 마크가 부여되었습니다.", "/mypage");
        } else {
            profile.revokeBadge();
        }
        return AdminMemberSummary.from(member, profile.isVerifiedBadge());
    }
}
