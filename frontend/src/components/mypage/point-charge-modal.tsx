import { CreditCard } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatNumber } from '@/lib/utils'

const PRESET_AMOUNTS = [10_000, 30_000, 50_000, 100_000]

/**
 * "포인트 충전" 모달 — 금액 선택 UI까지만. 결제(포트원) 연동 전이라
 * "충전하기"는 실제 결제를 진행하지 않고 안내만 띄운다.
 * 포트원 연동 시 이 컴포넌트의 handleCharge 만 실제 결제 요청으로 교체하면 된다.
 */
export function PointChargeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const [amount, setAmount] = useState<number | null>(null)
  const [custom, setCustom] = useState('')

  const reset = () => {
    setAmount(null)
    setCustom('')
  }

  const handleClose = () => {
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

  const handleCharge = () => {
    toast({
      title: '결제 연동 준비 중입니다.',
      description: '포트원 결제 연동이 완료되면 바로 충전하실 수 있어요.',
    })
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
          <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
            취소
          </Button>
          <Button type="button" size="sm" disabled={!amount} onClick={handleCharge}>
            <CreditCard className="size-4" aria-hidden />
            {amount ? `${formatNumber(amount)}P 충전하기` : '충전하기'}
          </Button>
        </>
      }
    >
      <div className="py-2">
        <div className="grid grid-cols-2 gap-2">
          {PRESET_AMOUNTS.map((value) => {
            const selected = amount === value && custom === ''
            return (
              <button
                key={value}
                type="button"
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
            placeholder="충전할 포인트 (숫자만)"
            value={custom}
            onChange={(event) => handleCustomChange(event.target.value)}
          />
        </div>

        <p className="mt-4 text-sm text-fg-subtle">
          결제는 포트원(PortOne)을 통해 안전하게 처리될 예정입니다. 현재는 연동 준비 중이라 실제
          충전은 이루어지지 않습니다.
        </p>
      </div>
    </Modal>
  )
}
