import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDismissable } from '@/hooks/use-dismissable'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[760px]',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useDismissable(open, onClose)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-fg/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col rounded-t-panel bg-surface shadow-overlay sm:rounded-panel',
          SIZE_CLASS[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-fg">{title}</h2>
            {description && <p className="mt-1.5 text-base text-fg-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-btn text-fg-muted hover:bg-surface-sunken hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </header>

        {children && <div className="overflow-y-auto px-6 pb-2">{children}</div>}

        {footer && (
          <footer className="flex justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </footer>
        )}
        {!footer && <div className="pb-6" />}
      </div>
    </div>,
    document.body,
  )
}
