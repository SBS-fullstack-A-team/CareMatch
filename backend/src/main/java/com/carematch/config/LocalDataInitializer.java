package com.carematch.config;

import com.carematch.member.domain.Member;
import com.carematch.member.domain.MemberStatus;
import com.carematch.member.domain.Role;
import com.carematch.member.repository.MemberRepository;
import com.carematch.support.domain.Faq;
import com.carematch.support.domain.Notice;
import com.carematch.support.repository.FaqRepository;
import com.carematch.support.repository.NoticeRepository;
import com.carematch.terms.domain.Terms;
import com.carematch.terms.domain.TermsType;
import com.carematch.terms.repository.TermsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * local 프로필 전용 시드 데이터.
 * - 약관 3종(active) : 회원가입 약관 검증이 동작하려면 필요
 * - 관리자 계정 1개 : admin / Admin123!
 * - 샘플 공지/FAQ
 */
@Slf4j
@Configuration
@Profile("local")
@RequiredArgsConstructor
public class LocalDataInitializer {

    private final TermsRepository termsRepository;
    private final MemberRepository memberRepository;
    private final NoticeRepository noticeRepository;
    private final FaqRepository faqRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner seedLocalData() {
        return args -> {
            if (termsRepository.findByActiveTrue().isEmpty()) {
                termsRepository.save(Terms.builder().type(TermsType.SERVICE).version("1.0")
                        .title("이용약관").content("케어매치 서비스 이용약관 본문(샘플).").active(true).build());
                termsRepository.save(Terms.builder().type(TermsType.PRIVACY).version("1.0")
                        .title("개인정보 수집·이용 동의").content("수집 항목/목적/보유기간 등(샘플).").active(true).build());
                termsRepository.save(Terms.builder().type(TermsType.MARKETING).version("1.0")
                        .title("마케팅 정보 수신 동의(선택)").content("이벤트/혜택 알림 발송(샘플).").active(true).build());
                log.info("[seed] 약관 3종 생성");
            }

            if (memberRepository.findByLoginId("admin").isEmpty()) {
                memberRepository.save(Member.builder()
                        .loginId("admin")
                        .password(passwordEncoder.encode("Admin123!"))
                        .email("admin@carematch.local")
                        .name("관리자")
                        .phone("010-0000-0000")
                        .role(Role.ADMIN)
                        .status(MemberStatus.ACTIVE)
                        .verified(true)
                        .build());
                log.info("[seed] 관리자 계정 생성: admin / Admin123!");
            }

            if (noticeRepository.count() == 0) {
                noticeRepository.save(Notice.builder().title("[공지] 케어매치 오픈 베타 안내")
                        .content("케어매치 오픈 베타를 시작합니다.").pinned(true).authorId(1L).build());
                faqRepository.save(Faq.builder().category("회원가입").sortOrder(1)
                        .question("시설회원은 왜 승인이 필요한가요?")
                        .answer("사업자등록증 확인 후 승인됩니다.").build());
                log.info("[seed] 샘플 공지/FAQ 생성");
            }
        };
    }
}
