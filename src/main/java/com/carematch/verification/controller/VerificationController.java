package com.carematch.verification.controller;

import com.carematch.verification.dto.VerificationDtos.SendCodeRequest;
import com.carematch.verification.dto.VerificationDtos.SendCodeResponse;
import com.carematch.verification.dto.VerificationDtos.VerifyCodeRequest;
import com.carematch.verification.dto.VerificationDtos.VerifyCodeResponse;
import com.carematch.verification.service.VerificationService;
import com.carematch.verification.service.VerificationService.SentCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;

/**
 * 이메일/휴대폰 인증코드 발송·검증 (회원가입 전 단계라 인증 불필요).
 */
@RestController
@RequestMapping("/api/verifications")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/send")
    public ResponseEntity<SendCodeResponse> send(@Valid @RequestBody SendCodeRequest request) {
        SentCode sent = verificationService.sendCode(request.channel(), request.target());
        return ResponseEntity.ok(new SendCodeResponse(
                sent.channel().name(),
                sent.target(),
                sent.expiresAt().atZone(ZoneId.systemDefault()).toOffsetDateTime(),
                sent.devCodeHint()));
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyCodeResponse> verify(@Valid @RequestBody VerifyCodeRequest request) {
        boolean verified = verificationService.verifyCode(request.channel(), request.target(), request.code());
        return ResponseEntity.ok(new VerifyCodeResponse(verified));
    }
}
