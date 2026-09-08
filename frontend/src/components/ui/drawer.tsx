import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDismissable } from '@/hooks/use-dismissable'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right'
}

export function Drawer({ open, onClose, title, children, footer, side = 'right' }: DrawerProps) {
  useDismissable(open, onClose)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-fg/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute top-0 bottom-0 flex w-[min(88vw,380px)] flex-col bg-surface shadow-overlay',
          side === 'right' ? 'right-0' : 'left-0',
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-2 grid size-10 place-items-center rounded-btn text-fg-muted hover:bg-surface-sunken hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="border-t border-border px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
