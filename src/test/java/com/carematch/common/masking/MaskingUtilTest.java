package com.carematch.common.masking;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MaskingUtilTest {

    @Test
    void maskPhone_11자리_가운데4자리_마스킹() {
        assertThat(MaskingUtil.maskPhone("010-1234-5678")).isEqualTo("010-****-5678");
        assertThat(MaskingUtil.maskPhone("01012345678")).isEqualTo("010-****-5678");
    }

    @Test
    void maskResidence_구단위까지만_노출() {
        assertThat(MaskingUtil.maskResidence("서울특별시 강남구 역삼동 123-45")).isEqualTo("서울특별시 강남구");
        assertThat(MaskingUtil.maskResidence("경기도 성남시 분당구 정자동")).isEqualTo("경기도 성남시 분당구");
    }

    @Test
    void maskEmail_로컬파트_앞2자리만_노출() {
        assertThat(MaskingUtil.maskEmail("abcdef@gmail.com")).isEqualTo("ab****@gmail.com");
    }

    @Test
    void maskName_가운데_마스킹() {
        assertThat(MaskingUtil.maskName("홍길동")).isEqualTo("홍*동");
        assertThat(MaskingUtil.maskName("김철")).isEqualTo("김*");
    }
}
