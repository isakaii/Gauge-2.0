// components/ui/use-toast.tsx

"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Types
interface ToastProps {
  title?: string
  description?: string
  duration?: number
}

type Toast = ToastProps & {
  id: string
}

// Toast Context
const ToastContext = createContext<{
  toasts: Toast[]
  addToast: (props: ToastProps) => void
  removeToast: (id: string) => void
} | null>(null)

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, ...props }
    setToasts((prev) => [...prev, newToast])

    if (props.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id)
      }, props.duration || 5000)
    }
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white rounded-lg border shadow-md p-4 animate-fade-in w-72 flex flex-col gap-1"
          >
            {toast.title && <div className="font-medium">{toast.title}</div>}
            {toast.description && <div className="text-sm text-gray-600">{toast.description}</div>}
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Simple function for direct usage without the context
export function toast(props: ToastProps) {
  // This is a simplified version that just logs to console
  // and doesn't actually show UI toasts when used outside the provider
  console.log("Toast:", props)
}