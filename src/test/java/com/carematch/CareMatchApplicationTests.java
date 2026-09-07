package com.carematch;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * 스프링 컨텍스트 구동 스모크 테스트 (local 프로필 = H2 인메모리).
 */
@ActiveProfiles("local")
@SpringBootTest
class CareMatchApplicationTests {

    @Test
    void contextLoads() {
    }
}
