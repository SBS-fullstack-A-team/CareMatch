package com.carematch.badge.service;

import com.carematch.badge.domain.CareerVerification;
import com.carematch.badge.dto.CareerVerificationDtos.CareerVerificationDetailResponse;
import com.carematch.badge.dto.CareerVerificationDtos.CreateCareerVerificationRequest;
import com.carematch.badge.repository.CareerVerificationRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.repository.JobSeekerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 경력 인증 신청/조회/삭제 — 구직자 본인만.
 * 자격증과 달리 파일 증빙이 없다 — 관리자가 텍스트 내용만 보고 승인/반려한다.
 */
@Service
@RequiredArgsConstructor
public class CareerVerificationService {

    private final CareerVerificationRepository careerVerificationRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;

    @Transactional
    public CareerVerificationDetailResponse register(Long memberId, CreateCareerVerificationRequest req) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));

        CareerVerification careerVerification = CareerVerification.builder()
                .jobSeekerProfile(profile)
                .organizationName(req.organizationName())
                .roleTitle(req.roleTitle())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .description(req.description())
                .build();
        profile.addCareerVerification(careerVerification);
        careerVerificationRepository.save(careerVerification);

        return toDetail(careerVerification);
    }

    @Transactional(readOnly = true)
    public List<CareerVerificationDetailResponse> listMine(Long memberId) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));
        return careerVerificationRepository.findByJobSeekerProfileId(profile.getId()).stream()
                .map(this::toDetail)
                .toList();
    }

    @Transactional
    public void delete(Long memberId, Long careerVerificationId) {
        CareerVerification careerVerification = loadOwned(memberId, careerVerificationId);
        careerVerificationRepository.delete(careerVerification);
    }

    private CareerVerification loadOwned(Long memberId, Long careerVerificationId) {
        CareerVerification careerVerification = careerVerificationRepository.findById(careerVerificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CAREER_VERIFICATION_NOT_FOUND, "careerVerification " + careerVerificationId));
        if (!careerVerification.getJobSeekerProfile().getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.CAREER_VERIFICATION_ACCESS_DENIED, "not owner of careerVerification " + careerVerificationId);
        }
        return careerVerification;
    }

    private CareerVerificationDetailResponse toDetail(CareerVerification c) {
        return new CareerVerificationDetailResponse(
                c.getId(), c.getOrganizationName(), c.getRoleTitle(), c.getStartDate(), c.getEndDate(),
                c.getDescription(), c.getStatus().name(), c.getRejectReason());
    }
}
