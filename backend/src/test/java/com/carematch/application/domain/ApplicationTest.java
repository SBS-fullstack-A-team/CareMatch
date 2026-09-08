package com.carematch.application.domain;

import com.carematch.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApplicationTest {

    private Application applied() {
        return Application.builder().jobPosting(null).jobSeekerProfile(null).message("hi").build();
    }

    @Test
    void 생성시_APPLIED() {
        assertThat(applied().getStatus()).isEqualTo(ApplicationStatus.APPLIED);
    }

    @Test
    void 취소는_APPLIED에서만() {
        Application a = applied();
        a.cancel();
        assertThat(a.getStatus()).isEqualTo(ApplicationStatus.CANCELED);
        assertThatThrownBy(a::cancel).isInstanceOf(BusinessException.class);
    }

    @Test
    void 수락_반려는_processedAt_설정_APPLIED에서만() {
        Application a = applied();
        a.accept();
        assertThat(a.getStatus()).isEqualTo(ApplicationStatus.ACCEPTED);
        assertThat(a.getProcessedAt()).isNotNull();
        assertThatThrownBy(a::reject).isInstanceOf(BusinessException.class);

        Application b = applied();
        b.reject();
        assertThat(b.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
        assertThat(b.getProcessedAt()).isNotNull();
    }

    @Test
    void 재지원은_CANCELED에서만() {
        Application a = applied();
        assertThatThrownBy(() -> a.reapply("again")).isInstanceOf(BusinessException.class);

        a.cancel();
        a.reapply("again");
        assertThat(a.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
        assertThat(a.getMessage()).isEqualTo("again");
        assertThat(a.getProcessedAt()).isNull();
    }

    @Test
    void 수락후_재지원_불가() {
        Application a = applied();
        a.accept();
        assertThatThrownBy(() -> a.reapply("x")).isInstanceOf(BusinessException.class);
    }
}
