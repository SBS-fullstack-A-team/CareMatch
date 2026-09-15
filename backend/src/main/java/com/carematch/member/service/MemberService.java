package com.carematch.member.service;

import com.carematch.auth.service.RefreshTokenService;
import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.FacilityProfile;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import com.carematch.member.dto.FacilitySignupRequest;
import com.carematch.member.dto.GeneralSignupRequest;
import com.carematch.member.dto.JobSeekerSignupRequest;
import com.carematch.member.dto.SignupResponse;
import com.carematch.member.dto.MyPageResponse;
import com.carematch.member.dto.SocialRoleSelectionRequest;
import com.carematch.member.repository.FacilityProfileRepository;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.member.repository.MemberRepository;
import com.carematch.point.PointService;
import com.carematch.storage.FileMetadata;
import com.carematch.storage.FileStorageService;
import com.carematch.terms.service.TermsService;
import com.carematch.verification.domain.VerificationChannel;
import com.carematch.verification.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원가입(구직자/시설) + 소셜 유형선택 + 아이디/이메일 중복확인.
 */
@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final FacilityProfileRepository facilityProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TermsService termsService;
    private final VerificationService verificationService;
    private final FileStorageService fileStorageService;
    private final PointService pointService;
    private final RefreshTokenService refreshTokenService;

    /**
     * 본인인증(이메일/휴대폰 코드 확인) 필수 여부. 프론트 연동 초기 단계라 임시로 기본 false.
     * 재활성화 시 Render 환경변수 VERIFICATION_REQUIRED_FOR_SIGNUP=true 로 켜거나 기본값을 true로 되돌린다.
     */
    @Value("${carematch.verification.required-for-signup:false}")
    private boolean verificationRequiredForSignup;

    // ---------------------------------------------------------------------
    // 중복 확인
    // ---------------------------------------------------------------------
    @Transactional(readOnly = true)
    public boolean isLoginIdAvailable(String loginId) {
        return loginId != null && !loginId.isBlank() && !memberRepository.existsByLoginId(loginId);
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return email != null && !email.isBlank() && !memberRepository.existsByEmail(email);
    }

    // ---------------------------------------------------------------------
    // 구직자 회원가입
    // ---------------------------------------------------------------------
    @Transactional
    public SignupResponse registerJobSeeker(JobSeekerSignupRequest req) {
        validateDuplicate(req.loginId(), req.email());
        PasswordPolicy.validate(req.password());
        if (verificationRequiredForSignup) {
            assertVerificationMatchesContact(req.verificationChannel(), req.verificationTarget(), req.email(), req.phone());
            verificationService.assertVerified(req.verificationChannel(), req.verificationTarget());
        }

        Member member = memberRepository.save(Member.builder()
                .loginId(req.loginId())
                .password(passwordEncoder.encode(req.password()))
                .email(req.email())
                .name(req.name())
                .phone(req.phone())
                .role(Role.JOBSEEKER)
                .status(MemberStatus.ACTIVE)
                .verified(true)
                .build());

        jobSeekerProfileRepository.save(JobSeekerProfile.builder()
                .member(member)
                .employmentStatus(EmploymentStatus.SEEKING)
                .residence(req.residence())
                .build());

        termsService.recordSignupAgreements(member, req.agreements());
        return SignupResponse.jobSeeker(member);
    }

    // ---------------------------------------------------------------------
    // 시설 회원가입 (승인 대기 상태로 저장)
    // ---------------------------------------------------------------------
    @Transactional
    public SignupResponse registerFacility(FacilitySignupRequest req) {
        validateDuplicate(req.loginId(), req.email());
        PasswordPolicy.validate(req.password());
        if (verificationRequiredForSignup) {
            assertVerificationMatchesContact(req.verificationChannel(), req.verificationTarget(), req.email(), req.phone());
            verificationService.assertVerified(req.verificationChannel(), req.verificationTarget());
        }

        String bizNo = normalizeBusinessNumber(req.businessRegistrationNumber());
        if (facilityProfileRepository.existsByBusinessRegistrationNumber(bizNo)) {
            throw new BusinessException(ErrorCode.INVALID_BUSINESS_NUMBER, "duplicate: " + bizNo);
        }

        // 업로드된 사업자등록증 파일 존재 확인 (스토리지 스텁: 항상 존재로 응답)
        FileMetadata meta = fileStorageService.confirmUpload(req.businessLicenseFileKey());
        if (!meta.exists()) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND, req.businessLicenseFileKey());
        }

        Member member = memberRepository.save(Member.builder()
                .loginId(req.loginId())
                .password(passwordEncoder.encode(req.password()))
                .email(req.email())
                .name(req.name())
                .phone(req.phone())
                .role(Role.FACILITY)
                .status(MemberStatus.ACTIVE)
                .verified(true)
                .build());

        facilityProfileRepository.save(FacilityProfile.builder()
                .member(member)
                .facilityName(req.facilityName())
                .facilityType(req.facilityType())
                .businessRegistrationNumber(bizNo)
                .businessLicenseFileKey(req.businessLicenseFileKey())
                .build());

        termsService.recordSignupAgreements(member, req.agreements());
        return SignupResponse.facility(member);
    }

    // ---------------------------------------------------------------------
    // 일반회원 가입 — 구직 의사 없이 개인적으로 요양보호사 등을 찾는 소비자 계정.
    // 자격증/구직 프로필 없이 member 로우만 생성한다.
    // ---------------------------------------------------------------------
    @Transactional
    public SignupResponse registerGeneral(GeneralSignupRequest req) {
        validateDuplicate(req.loginId(), req.email());
        PasswordPolicy.validate(req.password());
        if (verificationRequiredForSignup) {
            assertVerificationMatchesContact(req.verificationChannel(), req.verificationTarget(), req.email(), req.phone());
            verificationService.assertVerified(req.verificationChannel(), req.verificationTarget());
        }

        Member member = memberRepository.save(Member.builder()
                .loginId(req.loginId())
                .password(passwordEncoder.encode(req.password()))
                .email(req.email())
                .name(req.name())
                .phone(req.phone())
                .role(Role.GENERAL)
                .status(MemberStatus.ACTIVE)
                .verified(true)
                .build());

        termsService.recordSignupAgreements(member, req.agreements());
        return SignupResponse.general(member);
    }

    // ---------------------------------------------------------------------
    // 소셜 간편가입 후 회원 유형 확정
    // ---------------------------------------------------------------------
    @Transactional
    public Member selectSocialRole(Long memberId, SocialRoleSelectionRequest req) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (member.isRoleSelected()) {
            throw new BusinessException(ErrorCode.ROLE_ALREADY_SELECTED);
        }
        if (req.role() == Role.ADMIN) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "ADMIN 은 선택할 수 없습니다.");
        }

        member.assignRole(req.role());

        if (req.role() == Role.JOBSEEKER) {
            jobSeekerProfileRepository.save(JobSeekerProfile.builder()
                    .member(member)
                    .employmentStatus(EmploymentStatus.SEEKING)
                    .residence(req.residence())
                    .build());
        } else {
            if (isBlank(req.facilityName()) || req.facilityType() == null
                    || isBlank(req.businessRegistrationNumber())
                    || isBlank(req.businessLicenseFileKey())) {
                throw new BusinessException(ErrorCode.INVALID_INPUT,
                        "시설 유형 선택 시 시설명·시설유형·사업자 정보가 필수입니다.");
            }
            String bizNo = normalizeBusinessNumber(req.businessRegistrationNumber());
            if (facilityProfileRepository.existsByBusinessRegistrationNumber(bizNo)) {
                throw new BusinessException(ErrorCode.INVALID_BUSINESS_NUMBER, "duplicate: " + bizNo);
            }
            facilityProfileRepository.save(FacilityProfile.builder()
                    .member(member)
                    .facilityName(req.facilityName())
                    .facilityType(req.facilityType())
                    .businessRegistrationNumber(bizNo)
                    .businessLicenseFileKey(req.businessLicenseFileKey())
                    .build());
        }
        return member;
    }

    /**
     * 내 전화번호 등록/변경. 소셜 가입자는 가입 시 전화번호가 없어 이걸로 나중에 채운다.
     * 인증은 별도(/api/verifications) — 여기선 값만 저장한다.
     */
    @Transactional
    public void updatePhone(Long memberId, String phone) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.changePhone(phone);
    }

    /**
     * 회원 탈퇴. 아이디/비밀번호 계정은 본인 확인을 위해 현재 비밀번호를 검증한다
     * (소셜 전용 계정은 비밀번호가 없어 검증을 건너뛴다). 탈퇴 후에도 데이터는 남기고
     * status 만 WITHDRAWN 으로 바꾼다(CustomUserDetails.isEnabled() 가 이 상태를 보고
     * 로그인 자체를 막는다). 다른 기기에 남아있던 세션도 전부 무효화한다.
     */
    @Transactional
    public void withdraw(Long memberId, String rawPassword) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (member.getPassword() != null
                && (rawPassword == null || !passwordEncoder.matches(rawPassword, member.getPassword()))) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        member.withdraw();
        refreshTokenService.revokeAll(memberId);
    }

    // ---------------------------------------------------------------------
    // 비밀번호 찾기(재설정)
    // ---------------------------------------------------------------------
    /**
     * 로그인 전 비밀번호 재설정. 사전에 verificationChannel/verificationTarget 으로
     * {@code /api/verifications/send}+{@code /verify} 를 거쳐 인증을 완료해뒀어야 한다.
     * - 인증한 대상이 그 loginId 회원의 실제 email/phone 과 다르면 거부(남의 인증 재사용 방지)
     * - 소셜 전용 계정(password 없음)은 재설정 대상이 아님
     * - 성공 시 로그인 실패 잠금 해제 + 기존 Refresh Token 전부 무효화(다른 기기 강제 로그아웃)
     */
    @Transactional
    public void resetPassword(String loginId, VerificationChannel channel, String target, String newPassword) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (member.getPassword() == null) {
            throw new BusinessException(ErrorCode.SOCIAL_ONLY_ACCOUNT);
        }
        PasswordPolicy.validate(newPassword);
        assertVerificationMatchesContact(channel, target, member.getEmail(), member.getPhone());
        verificationService.assertVerified(channel, target);

        member.changePassword(passwordEncoder.encode(newPassword));
        member.resetLoginFail();
        refreshTokenService.revokeAll(member.getId());
    }

    // ---------------------------------------------------------------------
    // 마이페이지 요약
    // ---------------------------------------------------------------------
    @Transactional(readOnly = true)
    public MyPageResponse getMyPage(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        String employmentStatus = null;
        String facilityApprovalStatus = null;
        if (member.getRole() == Role.JOBSEEKER) {
            employmentStatus = jobSeekerProfileRepository.findByMemberId(memberId)
                    .map(p -> p.getEmploymentStatus().name()).orElse(null);
        } else if (member.getRole() == Role.FACILITY) {
            facilityApprovalStatus = facilityProfileRepository.findByMemberId(memberId)
                    .map(p -> p.getApprovalStatus().name()).orElse(null);
        }

        return new MyPageResponse(
                member.getId(),
                member.getName(),
                member.getEmail(),
                member.getPhone(),
                member.getRole() == null ? "GUEST" : member.getRole().name(),
                member.getMembershipType(),
                pointService.getBalance(memberId),
                employmentStatus,
                facilityApprovalStatus);
    }

    // ---------------------------------------------------------------------
    // 내부 검증 helper
    // ---------------------------------------------------------------------
    private void validateDuplicate(String loginId, String email) {
        if (memberRepository.existsByLoginId(loginId)) {
            throw new BusinessException(ErrorCode.DUPLICATE_LOGIN_ID);
        }
        if (memberRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    /** 인증한 대상이 실제 가입 정보(email/phone)와 같은지 확인 — 남의 인증 재사용 방지. */
    private void assertVerificationMatchesContact(VerificationChannel channel, String target,
                                                 String email, String phone) {
        boolean ok = switch (channel) {
            case EMAIL -> email != null && email.equalsIgnoreCase(target.trim());
            case PHONE -> phone != null
                    && phone.replaceAll("[^0-9]", "").equals(target.replaceAll("[^0-9]", ""));
        };
        if (!ok) {
            throw new BusinessException(ErrorCode.VERIFICATION_REQUIRED, "verified target != contact");
        }
    }

    /**
     * 사업자등록번호 정규화(하이픈 제거) + 형식(10자리 숫자) 검증.
     * 국세청 체크섬 검증은 필요 시 아래 passesBrnChecksum 로 강화 가능(현재는 형식만).
     */
    private String normalizeBusinessNumber(String raw) {
        String digits = raw == null ? "" : raw.replaceAll("[^0-9]", "");
        if (!digits.matches("\\d{10}")) {
            throw new BusinessException(ErrorCode.INVALID_BUSINESS_NUMBER, digits);
        }
        return digits;
    }

    /** 국세청 사업자등록번호 체크섬(10자리). 엄격 검증이 필요해지면 normalizeBusinessNumber 에서 호출. */
    @SuppressWarnings("unused")
    private boolean passesBrnChecksum(String bizNo) {
        if (bizNo == null || !bizNo.matches("\\d{10}")) {
            return false;
        }
        int[] weights = {1, 3, 7, 1, 3, 7, 1, 3, 5};
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += (bizNo.charAt(i) - '0') * weights[i];
        }
        sum += ((bizNo.charAt(8) - '0') * 5) / 10;
        int check = (10 - (sum % 10)) % 10;
        return check == (bizNo.charAt(9) - '0');
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
