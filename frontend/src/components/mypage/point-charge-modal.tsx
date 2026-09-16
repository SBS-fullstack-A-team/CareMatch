import PortOne from '@portone/browser-sdk/v2'
import { CreditCard } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { completePointCharge, preparePointCharge } from '@/api/points'
import { useApp } from '@/hooks/use-app'
import { ApiError } from '@/lib/api-client'
import { formatNumber } from '@/lib/utils'

const PRESET_AMOUNTS = [10_000, 30_000, 50_000, 100_000]

/** 결제 채널 키. 포트원 콘솔 > 연동 관리 > 채널 관리에서 발급 — 없으면 결제창을 열 수 없다. */
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY

/** 백엔드 signup 검증 규칙과 동일 (Signup/index.tsx 참고) */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/

/**
 * "포인트 충전" 모달.
 * 흐름: 서버에 결제건 준비(prepare) → 포트원 결제창(PortOne.requestPayment) → 완료 콜백에서
 * 서버 검증(complete, 포트원 서버 재조회로 금액/상태 확인) → 세션 포인트 갱신.
 *
 * 이니시스 V2 일반결제는 구매자 이메일·휴대폰 번호가 필수인데, 소셜 가입 등으로 계정에
 * 둘 중 하나가 비어있는 회원도 있다 — 그런 경우에만 결제창을 열기 전에 입력창을 보여준다.
 */
export function PointChargeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const { user, refreshUser } = useApp()
  const [amount, setAmount] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [charging, setCharging] = useState(false)

  const needsEmail = !user?.email
  const needsPhone = !user?.phone
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string }>({})

  const reset = () => {
    setAmount(null)
    setCustom('')
    setEmailInput('')
    setPhoneInput('')
    setFieldErrors({})
  }

  const handleClose = () => {
    if (charging) return
    reset()
    onClose()
  }

  const handlePreset = (value: number) => {
    setAmount(value)
    setCustom('')
  }

  const handleCustomChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '')
    setCustom(digitsOnly)
    setAmount(digitsOnly ? Number(digitsOnly) : null)
  }

  const handleCharge = async () => {
    if (!amount) return
    if (!PORTONE_CHANNEL_KEY) {
      toast({
        variant: 'error',
        title: '결제 채널이 설정되지 않았습니다.',
        description: '관리자에게 문의해 주세요. (VITE_PORTONE_CHANNEL_KEY 미설정)',
      })
      return
    }

    const nextErrors: { email?: string; phone?: string } = {}
    if (needsEmail && !EMAIL_RE.test(emailInput.trim())) {
      nextErrors.email = '이메일 형식이 올바르지 않습니다.'
    }
    if (needsPhone && !PHONE_RE.test(phoneInput.trim())) {
      nextErrors.phone = '휴대폰 번호 형식이 올바르지 않습니다.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const email = user?.email || emailInput.trim()
    const phoneNumber = user?.phone || phoneInput.trim()

    setCharging(true)
    try {
      const prepared = await preparePointCharge(amount)

      const payment = await PortOne.requestPayment({
        storeId: prepared.storeId,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: prepared.paymentId,
        orderName: prepared.orderName,
        totalAmount: prepared.amount,
        currency: 'KRW',
        payMethod: 'CARD',
        // 이니시스 V2 일반결제는 구매자 이메일·휴대폰 번호가 필수 — 계정에 없으면 방금 입력받은 값을 쓴다.
        customer: {
          email,
          fullName: user?.name,
          phoneNumber,
        },
        // 모바일 등 대부분의 환경은 결제창이 프로미스로 결과를 반환하지 않고 결제사
        // 페이지로 이동하는 "리다이렉트 방식"을 쓴다 — 포트원 SDK 문서상 이 경우
        // redirectUrl 이 없으면 결제창 호출 자체가 실패한다(모바일 전용 에러의 원인).
        // 리다이렉트로 돌아왔을 때는 이 페이지가 아니라 PointChargeCallbackPage 가
        // 쿼리 파라미터를 읽어 완료 처리한다 — PC의 팝업/iframe 방식은 그대로 아래
        // await 결과로 즉시 처리된다.
        redirectUrl: `${window.location.origin}/payment/point-charge/callback`,
      })

      if (!payment || payment.code) {
        toast({
          variant: 'error',
          title: '결제가 완료되지 않았습니다.',
          description: payment?.message ?? '결제창을 닫으셨거나 결제에 실패했습니다.',
        })
        return
      }

      const result = await completePointCharge(prepared.paymentId)
      await refreshUser()
      toast({
        title: '포인트 충전이 완료되었습니다.',
        description: `${formatNumber(result.chargedAmount)}P 충전되어 보유 포인트 ${formatNumber(result.balance)}P 입니다.`,
      })
      handleClose()
    } catch (err) {
      toast({
        variant: 'error',
        title: '충전에 실패했습니다.',
        description: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setCharging(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="포인트 충전"
      description="충전할 금액을 선택해 주세요."
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" disabled={charging} onClick={handleClose}>
            취소
          </Button>
          <Button type="button" size="sm" disabled={!amount || charging} onClick={handleCharge}>
            <CreditCard className="size-4" aria-hidden />
            {charging ? '결제 진행 중…' : amount ? `${formatNumber(amount)}P 충전하기` : '충전하기'}
          </Button>
        </>
      }
    >
      <div className="py-2">
        {(needsEmail || needsPhone) && (
          <div className="mb-4 space-y-3 rounded-input border border-border-strong bg-surface-sunken p-3">
            <p className="text-sm text-fg-muted">
              결제창 호출에 필요한 정보가 계정에 없어 먼저 입력해 주세요.
            </p>
            {needsEmail && (
              <div>
                <label htmlFor="charge-email" className="mb-1.5 block text-sm font-semibold text-fg">
                  이메일
                </label>
                <Input
                  id="charge-email"
                  type="email"
                  placeholder="example@carematch.co.kr"
                  value={emailInput}
                  invalid={Boolean(fieldErrors.email)}
                  disabled={charging}
                  onChange={(event) => {
                    setEmailInput(event.target.value)
                    setFieldErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-sm text-danger" role="alert">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            )}
            {needsPhone && (
              <div>
                <label htmlFor="charge-phone" className="mb-1.5 block text-sm font-semibold text-fg">
                  휴대폰 번호
                </label>
                <Input
                  id="charge-phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phoneInput}
                  invalid={Boolean(fieldErrors.phone)}
                  disabled={charging}
                  onChange={(event) => {
                    setPhoneInput(event.target.value)
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                />
                {fieldErrors.phone && (
                  <p className="mt-1.5 text-sm text-danger" role="alert">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {PRESET_AMOUNTS.map((value) => {
            const selected = amount === value && custom === ''
            return (
              <button
                key={value}
                type="button"
                disabled={charging}
                onClick={() => handlePreset(value)}
                className={
                  selected
                    ? 'flex h-12 items-center justify-center rounded-input border-2 border-primary bg-primary-light font-bold text-primary-deep'
                    : 'flex h-12 items-center justify-center rounded-input border border-border-strong bg-surface font-semibold text-fg transition-colors hover:border-primary hover:text-primary-deep'
                }
              >
                {formatNumber(value)}P
              </button>
            )
          })}
        </div>

        <div className="mt-3">
          <label htmlFor="custom-amount" className="mb-1.5 block text-sm font-semibold text-fg">
            직접 입력
          </label>
          <Input
            id="custom-amount"
            inputMode="numeric"
            placeholder="충전할 포인트 (숫자만, 1,000P~1,000,000P)"
            value={custom}
            disabled={charging}
            onChange={(event) => handleCustomChange(event.target.value)}
          />
        </div>

        <p className="mt-4 text-sm text-fg-subtle">
          결제는 포트원(PortOne)을 통해 안전하게 처리됩니다. 결제창에서 결제를 완료하면 검증 후
          바로 포인트가 적립됩니다.
        </p>
      </div>
    </Modal>
  )
}
