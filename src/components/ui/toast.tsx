'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle } from 'lucide-react'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
          variant === 'destructive'
            ? 'destructive border-destructive bg-destructive text-destructive-foreground'
            : 'border bg-background',
          className
        )}
        {...props}
      />
    )
  }
)
Toast.displayName = 'Toast'

export { Toast }

// Toast Container Component
export function ToastContainer({ toasts }: { toasts: Array<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' }> }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-lg shadow-lg p-4 border-l-4 animate-in slide-in-from-right-5',
            toast.variant === 'destructive'
              ? 'bg-red-50 border-red-500 text-red-900'
              : 'bg-white border-blue-500 text-gray-900'
          )}
        >
          <div className="flex items-start gap-3">
            {toast.variant === 'destructive' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-1 flex-1">
              <div className="font-semibold">{toast.title}</div>
              {toast.description && (
                <div className="text-sm opacity-80">{toast.description}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Simple toast hook
export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' }>>([])

  const toast = React.useCallback(
    ({ title, description, variant = 'default' }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((prev) => [...prev, { id, title, description, variant }])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    []
  )

  return { toast, toasts }
}
