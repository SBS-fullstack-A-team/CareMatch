package com.carematch.member.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MemberTest {

    private Member member() {
        return Member.builder().email("user@carematch.test").name("홍길동").build();
    }

    @Test
    void 기본_표시설정은_쉬운화면_꺼짐_글자크기_NORMAL() {
        Member m = member();
        assertThat(m.isEasyMode()).isFalse();
        assertThat(m.getFontScale()).isEqualTo(FontScale.NORMAL);
    }

    @Test
    void 표시설정_변경() {
        Member m = member();
        m.changeDisplayPreference(true, FontScale.XLARGE);
        assertThat(m.isEasyMode()).isTrue();
        assertThat(m.getFontScale()).isEqualTo(FontScale.XLARGE);
    }

    @Test
    void 글자크기_null이면_NORMAL로_보정() {
        Member m = member();
        m.changeDisplayPreference(true, null);
        assertThat(m.getFontScale()).isEqualTo(FontScale.NORMAL);
    }
}
