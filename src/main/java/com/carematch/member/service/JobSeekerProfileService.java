package com.carematch.member.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.JobSeekerProfileResponse;
import com.carematch.member.dto.JobSeekerProfileUpdateRequest;
import com.carematch.member.repository.JobSeekerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 구직자 프로필 수정 (본인). 조회는 {@link JobSeekerProfileQueryService} 담당.
 */
@Service
@RequiredArgsConstructor
public class JobSeekerProfileService {

    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final JobSeekerProfileQueryService queryService;

    /** 내 프로필(거주지/자기소개/취업상태/희망 근무조건) 수정 후 최신 프로필 반환. */
    @Transactional
    public JobSeekerProfileResponse updateMine(Long memberId, JobSeekerProfileUpdateRequest req) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "jobseeker profile of member " + memberId));

        profile.changeEmploymentStatus(req.employmentStatus());
        profile.updateProfile(req.residence(), req.introduction());
        profile.updateDesiredConditions(req.toDesiredConditions());

        return queryService.getMine(memberId);
    }
}
