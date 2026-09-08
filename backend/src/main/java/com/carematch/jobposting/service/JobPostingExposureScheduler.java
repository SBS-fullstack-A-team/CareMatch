package com.carematch.jobposting.service;

import com.carematch.jobposting.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 노출 옵션(PREMIUM/SPECIAL) 만료 처리.
 *
 * 등록 시 {@code exposureExpiredAt} 을 7일 후로만 잡아두고 강등 로직이 없었다(부채 C3).
 * RECOMMENDED / 비슷한공고 정렬은 {@code exposure_priority} 컬럼만 보므로, 만료된 공고를
 * NORMAL(우선순위 0) 로 내려주면 정렬에서 자연히 밀린다. {@code /featured} 는 이미 만료를 필터한다.
 *
 * 매일 새벽 1회 실행. 데모/로컬에서도 애플리케이션이 떠 있으면 동작.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JobPostingExposureScheduler {

    private final JobPostingRepository jobPostingRepository;

    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void demoteExpiredExposures() {
        int demoted = jobPostingRepository.demoteExpiredExposures(LocalDateTime.now());
        if (demoted > 0) {
            log.info("[jobposting] 노출 만료 강등 {}건", demoted);
        }
    }
}
