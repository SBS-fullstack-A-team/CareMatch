import { Badge } from '@/components/ui/badge'
import type { JobStatus } from '@/types'

const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  special: '스페셜',
  premium: '프리미엄',
  new: '새글',
  normal: '일반',
  closing: '마감임박',
}

interface JobBadgeProps {
  status: JobStatus
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 공고 상태 배지 (DESIGN_SYSTEM.md §14)
 * 5종 모두 렌더링 가능하며, 어떤 상태를 노출할지는 사용하는 쪽이 결정한다.
 * - 카드: special / premium 만 (isPromoted)
 * - 메인 최신 구인공고 TABLE: 5종 전부
 */
export function JobBadge({ status, size = 'sm', className }: JobBadgeProps) {
  return (
    <Badge variant={status} size={size} className={className}>
      {JOB_STATUS_LABEL[status]}
    </Badge>
  )
}

/** 유료 노출 공고인지 — 카드에서 배지를 보여줄지 판단한다 */
export function isPromoted(status: JobStatus) {
  return status === 'special' || status === 'premium'
}

export { JOB_STATUS_LABEL }
