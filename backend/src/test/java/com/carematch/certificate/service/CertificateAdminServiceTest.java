package com.carematch.certificate.service;

import com.carematch.certificate.domain.Certificate;
import com.carematch.certificate.domain.CertificateType;
import com.carematch.certificate.repository.CertificateRepository;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.notification.service.NotificationService;
import com.carematch.storage.FileStorageService;
import com.carematch.storage.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * 자격증 관리자 진위 심사(CertificateAdminService) — 파일 기술검증 전 상태에서는 심사할 수 없음을 검증.
 */
@ExtendWith(MockitoExtension.class)
class CertificateAdminServiceTest {

    @Mock
    private CertificateRepository certificateRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private StorageProperties storageProperties;
    @Mock
    private NotificationService notificationService;

    private CertificateAdminService service;
    private Certificate certificate;

    @BeforeEach
    void setUp() {
        service = new CertificateAdminService(certificateRepository, fileStorageService, storageProperties, notificationService);

        Member member = Member.builder().loginId("u1").password("pw").name("홍길동").email("u1@test.com").build();
        JobSeekerProfile profile = JobSeekerProfile.builder().member(member).employmentStatus(EmploymentStatus.SEEKING).build();
        certificate = Certificate.builder()
                .jobSeekerProfile(profile)
                .certificateType(CertificateType.CAREGIVER)
                .certificateNumber("num")
                .fileKey("key")
                .build();
        ReflectionTestUtils.setField(certificate, "id", 1L);
        when(certificateRepository.findById(1L)).thenReturn(Optional.of(certificate));
    }

    @Test
    void 파일_기술검증_전에는_심사할_수_없다() {
        assertThatThrownBy(() -> service.approve(1L))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.CERTIFICATE_FILE_NOT_VERIFIED));
    }

    @Test
    void 이미_심사완료된_건은_재처리할_수_없다() {
        certificate.markVerified(100L, "image/png");
        certificate.approveByAdmin(java.time.LocalDateTime.now());

        assertThatThrownBy(() -> service.approve(1L))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.CERTIFICATE_ALREADY_REVIEWED));
    }
}
