package com.carematch.service;


import com.carematch.entity.Member;
import com.carematch.entity.MemberStatus;
import com.carematch.entity.Role;
import com.carematch.repository.MemberRepository;
import com.carematch.dto.FacilityUpdateRequest;
import com.carematch.dto.LoginRequest;
import com.carematch.dto.LoginResponse;
import com.carematch.dto.MemberResponse;
import com.carematch.dto.SignUpRequest;
import com.carematch.service.PointService;
import com.carematch.global.exception.CustomException;
import com.carematch.global.exception.ErrorCode;
import com.carematch.security.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final PointService pointService;

    @Transactional
    public MemberResponse signUp(SignUpRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }

        Role role = request.roleAsEnum();

        if (role == Role.EMPLOYER && isBlank(request.businessRegistrationNumber())) {
            throw new CustomException(ErrorCode.BUSINESS_REGISTRATION_NUMBER_REQUIRED);
        }

        Member member = Member.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .phone(request.phone())
                .role(role)
                .status(role == Role.EMPLOYER ? MemberStatus.PENDING : MemberStatus.APPROVED)
                .businessRegistrationNumber(request.businessRegistrationNumber())
                .build();

        memberRepository.save(member);
        pointService.grantSignupBonus(member);

        return MemberResponse.from(member);
    }

    public LoginResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        String accessToken = jwtProvider.createAccessToken(member.getId(), member.getRole());
        String refreshToken = jwtProvider.createRefreshToken(member.getId());

        return new LoginResponse(accessToken, refreshToken, MemberResponse.from(member));
    }

    public MemberResponse getMyInfo(Long memberId) {
        return MemberResponse.from(findById(memberId));
    }

    /** 시설 회원이 시설 프로필을 등록/수정한다. 구인공고 등록 전 필수. */
    @Transactional
    public MemberResponse updateFacilityProfile(Long memberId, FacilityUpdateRequest request) {
        Member member = findById(memberId);

        if (member.getRole() != Role.EMPLOYER) {
            throw new CustomException(ErrorCode.EMPLOYER_ONLY);
        }

        member.updateFacilityProfile(
                request.facilityName(),
                request.facilityType(),
                request.managerName(),
                request.managerPosition(),
                request.facilityAddress()
        );
        return MemberResponse.from(member);
    }

    @Transactional
    public MemberResponse approve(Long memberId) {
        Member member = findById(memberId);
        member.approve();
        return MemberResponse.from(member);
    }

    @Transactional
    public MemberResponse reject(Long memberId) {
        Member member = findById(memberId);
        member.reject();
        return MemberResponse.from(member);
    }

    private Member findById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
