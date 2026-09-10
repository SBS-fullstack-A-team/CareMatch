import { Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { facilityTypeLabel } from '@/data/labels'
import type { FacilityType } from '@/types'

interface FacilityBadgeProps {
  type: FacilityType
  /** 아이콘 없이 텍스트만 */
  plain?: boolean
  size?: 'sm' | 'md'
}

export function FacilityBadge({ type, plain, size = 'sm' }: FacilityBadgeProps) {
  return (
    <Badge variant="neutralOutline" size={size}>
      {!plain && <Building2 aria-hidden />}
      {facilityTypeLabel(type)}
    </Badge>
  )
}
