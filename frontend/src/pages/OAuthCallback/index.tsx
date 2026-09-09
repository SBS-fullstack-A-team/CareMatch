import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/components/ui/toast'
import { tokenStore } from '@/lib/token-store'

/**
 * 소셜 로그인 콜백. 백엔드(OAUTH_SUCCESS_REDIRECT)가 이 경로로
 *   /oauth/callback?accessToken=...&refreshToken=...&roleSelected=false
 * 형태로 리다이렉트한다. 토큰을 저장하면 use-app 이 세션을 로드한다.
 */
export function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    const roleSelected = params.get('roleSelected') === 'true'

    if (params.get('error') || !accessToken || !refreshToken) {
      toast({ variant: 'error', title: '소셜 로그인에 실패했습니다.' })
      navigate('/login', { replace: true })
      return
    }

    tokenStore.set(accessToken, refreshToken)
    if (!roleSelected) {
      toast({
        variant: 'info',
        title: '회원 유형 선택이 필요합니다.',
        description: '유형 선택 화면은 준비 중입니다.',
      })
    }
    navigate('/', { replace: true })
  }, [params, navigate, toast])

  return (
    <div className="container-page py-20 text-center text-base text-fg-muted">
      로그인 처리 중…
    </div>
  )
}
