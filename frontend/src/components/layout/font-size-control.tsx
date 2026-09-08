import { FONT_SCALES, FONT_SCALE_LABEL, useApp } from '@/hooks/use-app'
import { cn } from '@/lib/utils'

/**
 * GNB 글자크기 조절 (DESIGN_SYSTEM.md §25)
 * 드롭다운이 아니라 상시 노출되는 세그먼트 형태를 사용한다.
 * 루트 폰트 크기를 바꾸므로 화면 전체 텍스트가 함께 커진다.
 */
export function FontSizeControl({ className }: { className?: string }) {
  const { fontScale, setFontScale } = useApp()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-fg-muted">글자크기</span>
      <div
        role="radiogroup"
        aria-label="글자크기"
        className="flex items-center gap-1 rounded-btn border border-border bg-surface p-1"
      >
        {FONT_SCALES.map((scale) => {
          const selected = fontScale === scale
          return (
            <button
              key={scale}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setFontScale(scale)}
              className={cn(
                'h-8 rounded-[6px] px-2.5 text-sm font-semibold transition-colors',
                selected
                  ? 'bg-primary text-white'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
              )}
            >
              {FONT_SCALE_LABEL[scale]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
