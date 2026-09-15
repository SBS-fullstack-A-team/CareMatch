package com.carematch.contact.service;

import com.carematch.contact.repository.ContactUnlockHistoryRepository;
import com.carematch.member.domain.EmploymentStatus;
import com.carematch.member.domain.JobSeekerProfile;
import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import com.carematch.member.repository.JobSeekerProfileRepository;
import com.carematch.member.repository.MemberRepository;
import com.carematch.point.PointPolicy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 연락처 열람(unlock) 동시요청 회귀 테스트.
 *
 * 과거 버그: 최초 열람 시 "이력 확인 → 포인트 차감 → 이력 저장" 순서였는데, 두 요청이 동시에
 * "이력 없음"을 확인하면 둘 다 차감까지 성공한 뒤 나중 이력 저장만 unique 제약으로 실패해서
 * 이중 차감 + 한 요청은 처리되지 않은 예외로 끝났다. "이력 선점을 먼저, 차감은 그다음"으로
 * 순서를 바꿔 고쳤다(ContactUnlockService.unlock() 참고).
 *
 * @SpringBootTest(비-@Transactional) 로 각 워커 스레드가 진짜 독립된 트랜잭션을 갖게 한다 —
 * 테스트 메서드를 @Transactional 로 감싸면 두 호출이 같은 트랜잭션 안에 묶여 이 레이스 자체가
 * 재현되지 않는다.
 */
@ActiveProfiles("local")
@SpringBootTest
class ContactUnlockServiceConcurrencyTest {

    @Autowired
    private ContactUnlockService contactUnlockService;
    @Autowired
    private MemberRepository memberRepository;
    @Autowired
    private JobSeekerProfileRepository jobSeekerProfileRepository;
    @Autowired
    private ContactUnlockHistoryRepository unlockHistoryRepository;

    @Test
    void 동시에_같은_인재를_열람해도_포인트는_한번만_차감된다() throws Exception {
        long initialPoint = 10_000L;
        Member facility = memberRepository.save(newMember("시설", initialPoint));
        Member seeker = memberRepository.save(newMember("구직자", 0L));
        JobSeekerProfile profile = jobSeekerProfileRepository.save(JobSeekerProfile.builder()
                .member(seeker)
                .employmentStatus(EmploymentStatus.SEEKING)
                .build());

        int concurrency = 8;
        ExecutorService pool = Executors.newFixedThreadPool(concurrency);
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Exception>> futures = pool.invokeAll(java.util.Collections.nCopies(concurrency, () -> {
                ready.countDown();
                start.await(5, TimeUnit.SECONDS);
                try {
                    contactUnlockService.unlock(facility.getId(), profile.getId());
                    return null;
                } catch (Exception e) {
                    return e;
                }
            }));
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            for (Future<Exception> f : futures) {
                Exception thrown = f.get(10, TimeUnit.SECONDS);
                // unlock() 자체가 던지는 예외(예: 잔액부족)는 없어야 한다 — 전부 정상 응답이어야 함.
                assertThat(thrown).as("unlock() 호출이 예외 없이 끝나야 함").isNull();
            }
        } finally {
            pool.shutdownNow();
        }

        long balanceAfter = memberRepository.findById(facility.getId()).orElseThrow().getPoint();
        assertThat(initialPoint - balanceAfter)
                .as("동시에 %d번 열람해도 딱 한 번(%dP)만 차감돼야 함", concurrency, PointPolicy.CONTACT_UNLOCK_COST)
                .isEqualTo(PointPolicy.CONTACT_UNLOCK_COST);

        assertThat(unlockHistoryRepository
                .findByFacilityMemberIdAndJobSeekerProfileId(facility.getId(), profile.getId()))
                .as("열람 이력은 정확히 1건이어야 함")
                .isPresent();
    }

    private Member newMember(String name, long point) {
        String unique = UUID.randomUUID().toString();
        Member member = Member.builder()
                .loginId("t_" + unique.substring(0, 8))
                .password("hash")
                .email(unique + "@test.local")
                .name(name)
                .phone("010-0000-0000")
                .role(Role.FACILITY)
                .status(MemberStatus.ACTIVE)
                .verified(true)
                .membershipType("BASIC")
                .build();
        member.creditPoint(point);
        return member;
    }
}
