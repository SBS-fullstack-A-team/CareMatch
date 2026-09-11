import { Info } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { LoadingState } from '@/components/common/loading-state'
import { selectSocialRole } from '@/api/auth'
import { useApp } from '@/hooks/use-app'
import { ApiError } from '@/lib/api-client'

type RoleKind = 'JOBSEEKER' | 'FACILITY'

/**
 * 소셜 최초 로그인 후 회원 유형(구직자/시설) 확정 화면.
 * `Login`/`OAuthCallback` 이 로그인 응답의 `roleSelected === false` 일 때 이리로 보낸다.
 * GUEST 토큰으로 접근한다고 가정하고, 세션이 이미 확정돼 있으면 홈으로 되돌린다.
 * 시설회원은 사업자등록증 업로드(businessLicenseFileKey)가 필수인데 파일 업로드 인프라가
 * 없어 Signup 화면과 동일하게 안내만 하고 막는다.
 */
export function OAuthSelectRolePage() {
  const { user, authReady } = useApp()
  const navigate = useNavigate()

  const [role, setRole] = useState<RoleKind>('JOBSEEKER')
  const [residence, setResidence] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    // GUEST 가 아니면(이미 유형을 확정한 세션) 이 화면에 있을 이유가 없다.
    if (user.role !== 'GUEST') {
      navigate('/', { replace: true })
    }
  }, [authReady, user, navigate])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (role === 'FACILITY') return

    setError(null)
    setSubmitting(true)
    try {
      await selectSocialRole({
        role: 'JOBSEEKER',
        residence: residence.trim() || undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '유형 선택에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!authReady || !user || user.role !== 'GUEST') {
    return (
      <div className="container-page py-20">
        <LoadingState rows={2} />
      </div>
    )
  }

  return (
    <div className="container-page">
      <div className="mx-auto w-full max-w-[420px] py-10">
        <h1 className="text-2xl font-bold text-fg">회원 유형 선택</h1>
        <p className="mt-2 text-base text-fg-muted">
          케어매치를 이용하려면 회원 유형을 선택해 주세요. 이후에는 바꿀 수 없습니다.
        </p>

        <div className="mt-8">
          <SegmentedControl
            items={[
              { value: 'JOBSEEKER', label: '구직자' },
              { value: 'FACILITY', label: '시설회원' },
            ]}
            value={role}
            onChange={setRole}
            size="lg"
          />
        </div>

        {role === 'FACILITY' ? (
          <div className="mt-5 flex gap-2.5 rounded-card border border-border bg-surface px-5 py-4">
            <Info className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
            <div>
              <p className="text-base font-semibold text-fg">
                시설회원 가입은 아직 준비 중입니다.
              </p>
              <p className="mt-1 text-base text-fg-muted">
                사업자등록증 확인 절차가 필요해 다음 단계에서 제공될 예정입니다. 지금은 구직자로
                이용할 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="residence" className="mb-1.5 block text-base font-semibold text-fg">
                거주지 <span className="font-normal text-fg-muted">(선택)</span>
              </label>
              <Input
                id="residence"
                placeholder="예) 서울특별시 강남구 역삼동"
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" block size="lg" disabled={submitting}>
              {submitting ? '처리 중…' : '구직자로 시작하기'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
