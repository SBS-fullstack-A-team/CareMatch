import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'info' | 'error'

interface ToastItem {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLE: Record<ToastVariant, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: 'text-primary' },
  info: { icon: Info, className: 'text-fg-muted' },
  error: { icon: CircleAlert, className: 'text-danger' },
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback<ToastContextValue['toast']>(
    ({ title, description, variant = 'success' }) => {
      const id = ++toastId
      setItems((prev) => [...prev, { id, title, description, variant }])
      window.setTimeout(() => remove(id), 4000)
    },
    [remove],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {items.length > 0 &&
        createPortal(
          <div
            className="fixed inset-x-4 bottom-6 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
            role="status"
            aria-live="polite"
          >
            {items.map((item) => {
              const { icon: Icon, className } = VARIANT_STYLE[item.variant]
              return (
                <div
                  key={item.id}
                  className="flex w-full max-w-[420px] items-start gap-3 rounded-card border border-border bg-surface px-4 py-3.5 shadow-overlay"
                >
                  <Icon className={cn('mt-0.5 size-5 shrink-0', className)} aria-hidden />
                  <div className="flex-1">
                    <p className="text-base font-bold text-fg">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-base text-fg-muted">{item.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="알림 닫기"
                    className="-mt-1 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-[6px] text-fg-subtle hover:bg-surface-sunken hover:text-fg"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.')
  return context
}
