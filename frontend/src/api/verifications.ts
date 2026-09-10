/** 본인인증 코드 API. docs/API.md §1 (회원가입 전, 공개) */
import { apiFetch } from '@/lib/api-client'
import type {
  SendCodeRequest,
  SendCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
} from '@/types/api'

/**
 * 이메일/휴대폰 인증코드 발송.
 * devCodeHint 는 서버 local 프로필에서만 채워진다 (배포 환경에서는 null).
 */
export function sendVerificationCode(req: SendCodeRequest): Promise<SendCodeResponse> {
  return apiFetch<SendCodeResponse>('/api/verifications/send', {
    method: 'POST',
    auth: false,
    body: req,
  })
}

/** 인증코드 검증. 코드가 틀리면 verified=false 또는 ApiError. */
export function verifyCode(req: VerifyCodeRequest): Promise<VerifyCodeResponse> {
  return apiFetch<VerifyCodeResponse>('/api/verifications/verify', {
    method: 'POST',
    auth: false,
    body: req,
  })
}
