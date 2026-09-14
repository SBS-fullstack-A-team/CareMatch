import { Type } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FontSizeModal } from '@/components/layout/font-size-modal'
import { cn } from '@/lib/utils'

/**
 * GNB 글자크기 조절 (DESIGN_SYSTEM.md §25)
 * "글자크기" 버튼 하나만 노출하고, 클릭하면 슬라이더 모달(FontSizeModal)이 뜬다.
 */
export function FontSizeControl({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(className)}
      >
        <Type className="size-[18px]" aria-hidden />
        글자크기
      </Button>
      <FontSizeModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
