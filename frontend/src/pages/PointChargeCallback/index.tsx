import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { completePointCharge } from '@/api/points'
import { useApp } from '@/hooks/use-app'
import { ApiError } from '@/lib/api-client'
import { formatNumber } from '@/lib/utils'

/**
 * 포인트 충전 결제 리다이렉트 콜백.
 *
 * 모바일 등 리다이렉트 방식 결제 환경에서는 포트원 결제창이 프로미스로 결과를
 * 반환하지 않고(페이지 자체가 결제사 페이지로 이동했다가 돌아오므로), 대신
 * `redirectUrl`(이 페이지)로 결제 결과를 쿼리 파라미터에 담아 돌아온다.
 * PointChargeModal의 데스크톱(팝업/iframe) 흐름과 동일하게, 여기서도 서버에
 * paymentId를 다시 검증(complete)한 뒤에만 포인트를 적립한다.
 */
export function PointChargeCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { refreshUser } = useApp()
  const handled = useRef(false)
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const paymentId = params.get('paymentId')
    const failureCode = params.get('code')
    const failureMessage = params.get('message')

    if (failureCode || !paymentId) {
      setStatus('error')
      setErrorMessage(failureMessage || '결제가 완료되지 않았습니다.')
      return
    }

    completePointCharge(paymentId)
      .then(async (result) => {
        await refreshUser()
        setStatus('success')
        toast({
          title: '포인트 충전이 완료되었습니다.',
          description: `${formatNumber(result.chargedAmount)}P 충전되어 보유 포인트 ${formatNumber(result.balance)}P 입니다.`,
        })
      })
      .catch((err) => {
        setStatus('error')
        setErrorMessage(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container-page flex flex-col items-center gap-4 py-20 text-center">
      {status === 'processing' && (
        <p className="text-base text-fg-muted">결제 결과를 확인하는 중입니다…</p>
      )}
      {status === 'success' && (
        <>
          <p className="text-lg font-bold text-fg">포인트 충전이 완료되었습니다.</p>
          <Button onClick={() => navigate('/mypage', { replace: true })}>마이페이지로 이동</Button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-lg font-bold text-fg">충전에 실패했습니다.</p>
          <p className="text-base text-fg-muted">{errorMessage}</p>
          <Button onClick={() => navigate('/mypage', { replace: true })}>마이페이지로 이동</Button>
        </>
      )}
    </div>
  )
}
