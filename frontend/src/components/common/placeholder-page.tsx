import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** 아직 구현되지 않은 라우트. 화면 순서에 따라 순차적으로 교체된다. */
export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-[520px] rounded-panel border border-border bg-surface p-10 text-center shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-light text-primary-deep">
          <Construction className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-fg">{title}</h1>
        <p className="mt-2.5 text-base text-fg-muted">
          {description ?? '이 화면은 다음 단계에서 구현될 예정입니다.'}
        </p>
        <Link to="/" className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'mt-6')}>
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
