/** 포인트 충전(포트원 결제) API. 보호자회원(GENERAL)·시설회원만 호출 가능. */
import { apiFetch } from '@/lib/api-client'
import type { PointChargeCompleteResponse, PointChargePrepareResponse } from '@/types/api'

/** 결제창을 열기 전, paymentId 를 먼저 발급받는다. */
export function preparePointCharge(amount: number): Promise<PointChargePrepareResponse> {
  return apiFetch<PointChargePrepareResponse>('/api/points/charge/prepare', {
    method: 'POST',
    body: { amount },
  })
}

/** 결제창 완료 콜백 직후 호출. 서버가 포트원에 재조회해 검증한 뒤에만 포인트를 적립한다. */
export function completePointCharge(paymentId: string): Promise<PointChargeCompleteResponse> {
  return apiFetch<PointChargeCompleteResponse>('/api/points/charge/complete', {
    method: 'POST',
    body: { paymentId },
  })
}
