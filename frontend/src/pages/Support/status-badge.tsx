import { Badge } from '@/components/ui/badge'
import type { InquiryStatus } from '@/types/api'

/** 문의 상태 — 백엔드 InquiryStatus(PENDING / ANSWERED) 를 기존 Badge 로 표시한다 */
export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return status === 'ANSWERED' ? (
    <Badge variant="new">답변완료</Badge>
  ) : (
    <Badge variant="neutralOutline">답변대기</Badge>
  )
}
