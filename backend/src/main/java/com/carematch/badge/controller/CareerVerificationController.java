package com.carematch.badge.controller;

import com.carematch.badge.dto.CareerVerificationDtos.CareerVerificationDetailResponse;
import com.carematch.badge.dto.CareerVerificationDtos.CreateCareerVerificationRequest;
import com.carematch.badge.service.CareerVerificationService;
import com.carematch.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 경력 인증 신청/조회/삭제 — 구직자 본인만. 파일 증빙 없이 텍스트만 제출한다.
 */
@RestController
@RequestMapping("/api/career-verifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('JOBSEEKER')")
public class CareerVerificationController {

    private final CareerVerificationService careerVerificationService;

    @PostMapping
    public ResponseEntity<CareerVerificationDetailResponse> register(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateCareerVerificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(careerVerificationService.register(principal.getMemberId(), request));
    }

    @GetMapping("/me")
    public List<CareerVerificationDetailResponse> listMine(@AuthenticationPrincipal CustomUserDetails principal) {
        return careerVerificationService.listMine(principal.getMemberId());
    }

    @DeleteMapping("/{careerVerificationId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable Long careerVerificationId) {
        careerVerificationService.delete(principal.getMemberId(), careerVerificationId);
        return ResponseEntity.noContent().build();
    }
}
