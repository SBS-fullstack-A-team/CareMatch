package com.carematch.badge.service;

import com.carematch.badge.domain.BadgeRequestStatus;
import com.carematch.badge.domain.CareerVerificationStatus;
import com.carematch.badge.repository.BadgeRequestRepository;
import com.carematch.badge.repository.CareerVerificationRepository;
import com.carematch.certificate.domain.CertificateReviewStatus;
import com.carematch.certificate.repository.CertificateRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.repository.JobSeekerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * "인증구직자" 마크 신청 전제조건(BadgeRequestService.request) 검증.
 */
@ExtendWith(MockitoExtension.class)
class BadgeRequestServiceTest {

    @Mock
    private BadgeRequestRepository badgeRequestRepository;
    @Mock
    private CertificateRepository certificateRepository;
    @Mock
    private CareerVerificationRepository careerVerificationRepository;
    @Mock
    private JobSeekerProfileRepository jobSeekerProfileRepository;

    private BadgeRequestService service;
    private JobSeekerProfile profile;

    @BeforeEach
    void setUp() {
        service = new BadgeRequestService(badgeRequestRepository, certificateRepository,
                careerVerificationRepository, jobSeekerProfileRepository);

        Member member = Member.builder().loginId("u1").password("pw").name("홍길동").email("u1@test.com").build();
        profile = JobSeekerProfile.builder().member(member).employmentStatus(EmploymentStatus.SEEKING).build();
        ReflectionTestUtils.setField(profile, "id", 1L);
        lenient().when(jobSeekerProfileRepository.findByMemberId(10L)).thenReturn(Optional.of(profile));
    }

    @Test
    void 이미_마크를_보유하면_409() {
        ReflectionTestUtils.setField(profile, "verifiedBadge", true);

        assertThatThrownBy(() -> service.request(10L))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode()).isEqualTo(ErrorCode.BADGE_ALREADY_GRANTED));
    }

    @Test
    void 이미_심사중인_요청이_있으면_409() {
        when(badgeRequestRepository.existsByJobSeekerProfileIdAndStatus(1L, BadgeRequestStatus.PENDING))
                .thenReturn(true);

        assertThatThrownBy(() -> service.request(10L))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode()).isEqualTo(ErrorCode.BADGE_REQUEST_ALREADY_PENDING));
    }

    @Test
    void 승인된_자격증_또는_경력인증이_없으면_400() {
        when(badgeRequestRepository.existsByJobSeekerProfileIdAndStatus(1L, BadgeRequestStatus.PENDING))
                .thenReturn(false);
        when(certificateRepository.existsByJobSeekerProfileIdAndAdminReviewStatus(1L, CertificateReviewStatus.APPROVED))
                .thenReturn(true);
        when(careerVerificationRepository.existsByJobSeekerProfileIdAndStatus(1L, CareerVerificationStatus.APPROVED))
                .thenReturn(false);

        assertThatThrownBy(() -> service.request(10L))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode()).isEqualTo(ErrorCode.BADGE_REQUIREMENTS_NOT_MET));
    }

    @Test
    void 승인된_자격증과_경력인증이_모두_있으면_요청_생성() {
        when(badgeRequestRepository.existsByJobSeekerProfileIdAndStatus(1L, BadgeRequestStatus.PENDING))
                .thenReturn(false);
        when(certificateRepository.existsByJobSeekerProfileIdAndAdminReviewStatus(1L, CertificateReviewStatus.APPROVED))
                .thenReturn(true);
        when(careerVerificationRepository.existsByJobSeekerProfileIdAndStatus(1L, CareerVerificationStatus.APPROVED))
                .thenReturn(true);
        when(badgeRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.request(10L);
    }
}
