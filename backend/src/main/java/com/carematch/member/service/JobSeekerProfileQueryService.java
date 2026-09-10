package com.carematch.member.service;

import com.carematch.common.exception.BusinessException;
import com.carematch.common.exception.ErrorCode;
import com.carematch.common.masking.MaskingUtil;
import com.carematch.contact.service.ContactUnlockService;
import com.carematch.member.domain.DesiredRegion;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.dto.CertificateResponse;
import com.carematch.member.dto.JobSeekerProfileResponse;
import com.carematch.member.dto.PostingMatchResponse;
import com.carematch.member.dto.RegionDto;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.point.StubPointService;
import com.carematch.storage.FileStorageService;
import com.carematch.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Year;
import java.util.Collection;
import java.util.List;

/**
 * 구직자 프로필 조회.
 * - 시설회원 대상: 이름/연락처/거주지 마스킹, 연락처 열람(unlock) 했으면 언마스크. 자격증은 서명 URL 제공.
 * - 본인 대상: 전체 언마스크.
 */
@Service
@RequiredArgsConstructor
public class JobSeekerProfileQueryService {

    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final ContactUnlockService contactUnlockService;
    private final FileStorageService fileStorageService;
    private final StorageProperties storageProperties;
    private final TalentMatcher talentMatcher;

    /** 시설회원이 보는 인재 상세 (기본 마스킹). */
    @Transactional(readOnly = true)
    public JobSeekerProfileResponse getForFacility(Long profileId, Long facilityMemberId) {
        JobSeekerProfile profile = load(profileId);

        boolean unlocked = !profile.isEmployed()
                && contactUnlockService.hasUnlocked(facilityMemberId, profileId);

        String name = unlocked
                ? profile.getMember().getName()
                : MaskingUtil.maskName(profile.getMember().getName());
        String phone = unlocked
                ? profile.getMember().getPhone()
                : MaskingUtil.maskPhone(profile.getMember().getPhone());
        String residence = unlocked
                ? profile.getResidence()
                : MaskingUtil.maskResidence(profile.getResidence());

        List<PostingMatchResponse> matches = talentMatcher.matchesFor(profile, facilityMemberId);
        return build(profile, name, phone, residence, unlocked, signedCertificates(profile),
                talentMatcher.bestScore(matches), matches);
    }

    /** 본인이 보는 내 프로필 (전체 공개). */
    @Transactional(readOnly = true)
    public JobSeekerProfileResponse getMine(Long memberId) {
        JobSeekerProfile profile = jobSeekerProfileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobseeker profile of member " + memberId));
        return build(profile, profile.getMember().getName(), profile.getMember().getPhone(), profile.getResidence(),
                true, signedCertificates(profile), null, List.of());
    }

    private JobSeekerProfile load(Long profileId) {
        return jobSeekerProfileRepository.findWithDetailsById(profileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "jobSeekerProfile " + profileId));
    }

    private List<CertificateResponse> signedCertificates(JobSeekerProfile profile) {
        Duration ttl = Duration.ofSeconds(storageProperties.presignExpirySeconds());
        return profile.getCertificates().stream()
                .map(c -> CertificateResponse.withUrl(c, fileStorageService.issueDownloadUrl(c.getFileKey(), ttl)))
                .toList();
    }

    private JobSeekerProfileResponse build(JobSeekerProfile profile, String name, String phone, String residence,
                                           boolean unlocked, List<CertificateResponse> certs,
                                           Integer matchingScore, List<PostingMatchResponse> postingMatches) {
        Integer age = profile.getBirthYear() == null ? null
                : Year.now().getValue() - profile.getBirthYear();

        return new JobSeekerProfileResponse(
                profile.getId(),
                profile.getMember().getId(),
                name,
                profile.getEmploymentStatus().name(),
                phone,
                residence,
                profile.getIntroduction(),
                unlocked,
                StubPointService.CONTACT_UNLOCK_COST,
                certs,
                name(profile.getGender()),
                age,
                profile.getPhotoUrl(),
                profile.getCareerYears(),
                name(profile.getEducation()),
                profile.getHeadline(),
                names(profile.getAvailableTasks()),
                name(profile.getDesiredJobType()),
                name(profile.getDesiredWorkType()),
                name(profile.getDesiredWorkSchedule()),
                regions(profile.getDesiredRegions()),
                name(profile.getDesiredPayType()),
                profile.getDesiredMinPay(),
                names(profile.getDesiredEmploymentTypes()),
                profile.getDesiredWorkDays(),
                profile.getDesiredWorkStartTime(),
                profile.getDesiredWorkEndTime(),
                matchingScore,
                postingMatches);
    }

    private static String name(Enum<?> e) {
        return e == null ? null : e.name();
    }

    private static List<RegionDto> regions(Collection<DesiredRegion> rs) {
        return rs == null ? List.of() : rs.stream().map(RegionDto::from).toList();
    }

    private static List<String> names(Collection<? extends Enum<?>> es) {
        return es == null ? List.of() : es.stream().map(Enum::name).sorted().toList();
    }
}
