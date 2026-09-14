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
                        .title("이용약관").content(SERVICE_TERMS_CONTENT).active(true).build());
                termsRepository.save(Terms.builder().type(TermsType.PRIVACY).version("1.0")
                        .title("개인정보 수집·이용 동의").content(PRIVACY_TERMS_CONTENT).active(true).build());
                termsRepository.save(Terms.builder().type(TermsType.MARKETING).version("1.0")
                        .title("마케팅 정보 수신 동의(선택)").content(MARKETING_TERMS_CONTENT).active(true).build());
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
                        .content("케어매치 오픈 베타를 시작합니다. 요양보호사, 간병인, 가사도우미 구직자와 요양시설을 빠르고 "
                                + "믿을 수 있게 연결해 드리겠습니다. 서비스 이용 중 불편한 점이 있다면 고객센터로 언제든 알려주세요.")
                        .pinned(true).authorId(1L).build());
                noticeRepository.save(Notice.builder().title("[안내] 자격증 파일 등록 서비스 오픈")
                        .content("이제 마이페이지 > 자격증에서 자격증 사진이나 PDF 파일을 직접 첨부해 등록할 수 있습니다. "
                                + "등록된 자격증은 검증 절차를 거쳐 인재정보에 인증 배지로 표시되며, 시설회원에게 더 높은 신뢰도로 "
                                + "노출됩니다. 최초 등록 시에는 휴대폰 본인인증이 한 번 필요합니다.")
                        .pinned(false).authorId(1L).build());
                noticeRepository.save(Notice.builder().title("[공지] 개인정보처리방침 개정 안내")
                        .content("이용자 보호를 강화하기 위해 개인정보처리방침 일부 조항이 개정되었습니다. 수집 항목, 보유기간, "
                                + "제3자 제공 범위 등 자세한 내용은 하단 '개인정보처리방침' 페이지에서 확인하실 수 있습니다. "
                                + "개정된 방침은 게시일로부터 적용됩니다.")
                        .pinned(false).authorId(1L).build());
                noticeRepository.save(Notice.builder().title("[이벤트] 요양보호사 자격증 인증 완료 시 포인트 지급")
                        .content("자격증 등록 후 검증까지 완료한 요양보호사, 간호조무사, 사회복지사 회원 전원에게 포인트를 "
                                + "지급하는 이벤트를 진행합니다. 지급된 포인트는 인재정보 열람 등 서비스 내에서 사용할 수 있습니다. "
                                + "자세한 내용은 고객센터로 문의해 주세요.")
                        .pinned(false).authorId(1L).build());

                faqRepository.save(Faq.builder().category("회원가입").sortOrder(1)
                        .question("시설회원은 왜 승인이 필요한가요?")
                        .answer("사업자등록증 확인 후 승인됩니다.").build());
                faqRepository.save(Faq.builder().category("구직신청").sortOrder(2)
                        .question("구직신청 후 지원 현황은 어디서 확인하나요?")
                        .answer("마이페이지 > 지원내역에서 공고별 진행 상태(지원완료/합격/불합격 등)를 확인할 수 있습니다.")
                        .build());
                faqRepository.save(Faq.builder().category("자격증").sortOrder(3)
                        .question("자격증 파일은 어떤 형식으로 등록하나요?")
                        .answer("jpg, png, pdf 파일을 5MB 이하로 첨부하면 됩니다. 등록 후 자동으로 검증 절차가 진행되며, "
                                + "최초 등록 시에는 휴대폰 본인인증이 필요합니다.")
                        .build());
                faqRepository.save(Faq.builder().category("인재정보").sortOrder(4)
                        .question("인재정보 상세 연락처는 어떻게 확인하나요?")
                        .answer("포인트를 사용해 연락처를 열람할 수 있으며, 열람 이력은 마이페이지에서 확인할 수 있습니다.")
                        .build());
                log.info("[seed] 샘플 공지 4건 / FAQ 4건 생성");
            }
        };
    }

    private static final String SERVICE_TERMS_CONTENT = """
            제1조 (목적)
            이 약관은 주식회사 케어매치(이하 "회사")가 제공하는 요양 인력 구인구직 매칭 서비스 "케어매치"(이하 "서비스")의 \
            이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.

            제2조 (정의)
            1. "회원"이란 이 약관에 동의하고 회사와 서비스 이용계약을 체결한 개인회원(구직자) 및 시설회원을 말합니다.
            2. "개인회원"이란 요양보호사, 간병인, 가사도우미 등으로 구직 활동을 하는 회원을 말합니다.
            3. "시설회원"이란 요양시설, 재가센터 등 인력을 채용하고자 하는 사업자 회원을 말합니다.

            제3조 (약관의 효력 및 변경)
            1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
            2. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 \
            명시하여 사전 공지합니다.

            제4조 (서비스의 제공 및 변경)
            회사는 구인공고 등록·검색, 인재정보 조회, 구직신청, 자격증 등록·검증 등의 서비스를 제공하며, 운영상 \
            필요에 따라 제공하는 서비스의 내용을 변경할 수 있습니다.

            제5조 (회원가입)
            1. 회원가입은 이용자가 약관에 동의하고 회사가 정한 가입 절차에 따라 신청함으로써 체결됩니다.
            2. 시설회원은 사업자등록증 등 관련 서류 확인을 거쳐 승인된 이후 서비스를 이용할 수 있습니다.

            제6조 (회원의 의무)
            회원은 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수해야 하며, \
            타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.

            제7조 (계약해지 및 이용제한)
            회원은 언제든지 마이페이지를 통해 이용계약 해지를 신청할 수 있으며, 회사는 회원이 이 약관을 위반한 경우 \
            사전 통지 후 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.

            제8조 (면책조항)
            회사는 회원이 게재한 구인공고 및 구직정보의 진위 여부에 대해 보증하지 않으며, 회원 간 채용 과정에서 \
            발생한 분쟁에 대해서는 관련 법령에 따라 책임이 제한될 수 있습니다.

            (본 약관은 서비스 안내를 위한 예시 콘텐츠입니다.)""";

    private static final String PRIVACY_TERMS_CONTENT = """
            주식회사 케어매치(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 \
            준수하고 있습니다.

            1. 수집하는 개인정보 항목
            - 필수: 이름, 아이디, 비밀번호, 이메일, 휴대폰번호
            - 선택: 거주지역, 프로필 사진, 경력·자격 정보
            - 시설회원: 사업자등록번호, 사업자등록증 사본

            2. 개인정보의 수집 및 이용 목적
            - 회원 가입 의사 확인 및 본인 인증
            - 구인·구직 매칭 서비스 제공, 자격증 등록·검증
            - 부정 이용 방지 및 민원 처리

            3. 개인정보의 보유 및 이용 기간
            회원 탈퇴 시까지 보유하며, 탈퇴 후에는 관계 법령이 정한 기간 동안 별도 보관 후 파기합니다.

            4. 개인정보의 제3자 제공
            회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않으며, 법령에 근거가 있는 경우에 한해 예외적으로 \
            제공할 수 있습니다.

            5. 개인정보의 파기 절차 및 방법
            보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기하며, 전자적 파일은 복구할 수 없는 \
            방법으로 영구 삭제합니다.

            6. 이용자의 권리
            이용자는 언제든지 자신의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴를 통해 수집·이용 동의를 철회할 수 \
            있습니다.

            7. 개인정보 보호책임자
            성명: 홍길동 / 이메일: help@carematch.co.kr / 연락처: 1588-1234

            (본 방침은 서비스 안내를 위한 예시 콘텐츠입니다.)""";

    private static final String MARKETING_TERMS_CONTENT = """
            주식회사 케어매치는 이벤트, 혜택, 서비스 소식 등을 안내하기 위해 이메일, 문자(SMS), 앱 알림을 통해 \
            마케팅 정보를 발송할 수 있습니다.

            본 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에 제한이 없습니다. 동의 이후에도 마이페이지 설정 \
            또는 고객센터를 통해 언제든지 수신을 거부할 수 있습니다.

            (본 동의 문구는 서비스 안내를 위한 예시 콘텐츠입니다.)""";
}
