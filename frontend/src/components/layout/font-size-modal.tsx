import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  fontScalePercent,
  useApp,
} from '@/hooks/use-app'
import { cn } from '@/lib/utils'

interface FontSizeModalProps {
  open: boolean
  onClose: () => void
}

/**
 * "글자크기" 버튼 클릭 시 뜨는 작은 모달. 슬라이더 + 좌우 버튼으로 10단계 조절.
 * 루트 font-size(%) 를 즉시 바꾸므로 모달 밖 화면 전체가 실시간으로 함께 커진다.
 */
export function FontSizeModal({ open, onClose }: FontSizeModalProps) {
  const { fontScale, setFontScale } = useApp()

  const atMin = fontScale <= FONT_SCALE_MIN
  const atMax = fontScale >= FONT_SCALE_MAX

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="글자크기"
      description="화면 전체 글자 크기를 10단계로 조절합니다."
      size="sm"
    >
      <div className="py-2">
        <p className="text-center text-3xl font-bold text-fg tabular" aria-live="polite">
          {fontScalePercent(fontScale)}%
        </p>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            aria-label="글자 작게"
            disabled={atMin}
            onClick={() => setFontScale(fontScale - 1)}
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-btn border border-border-strong text-fg-muted transition-colors',
              atMin
                ? 'opacity-40'
                : 'hover:border-primary hover:bg-primary-light hover:text-primary-deep',
            )}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>

          <input
            type="range"
            min={FONT_SCALE_MIN}
            max={FONT_SCALE_MAX}
            step={1}
            value={fontScale}
            onChange={(event) => setFontScale(Number(event.target.value))}
            aria-label="글자크기 단계"
            aria-valuemin={FONT_SCALE_MIN}
            aria-valuemax={FONT_SCALE_MAX}
            aria-valuenow={fontScale}
            aria-valuetext={`${fontScale}단계, ${fontScalePercent(fontScale)}%`}
            className="h-11 w-full min-w-0 flex-1 cursor-pointer accent-primary"
          />

          <button
            type="button"
            aria-label="글자 크게"
            disabled={atMax}
            onClick={() => setFontScale(fontScale + 1)}
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-btn border border-border-strong text-fg-muted transition-colors',
              atMax
                ? 'opacity-40'
                : 'hover:border-primary hover:bg-primary-light hover:text-primary-deep',
            )}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-fg-subtle">
          <span>작게</span>
          <span className="tabular">
            {fontScale} / {FONT_SCALE_MAX}단계
          </span>
          <span>크게</span>
        </div>

        <p className="mt-5 rounded-card border border-border bg-surface-sunken px-4 py-3 text-base break-keep text-fg">
          미리보기: 사람과 사람을 이어주는 요양 일자리 플랫폼입니다.
        </p>
      </div>
    </Modal>
  )
}
