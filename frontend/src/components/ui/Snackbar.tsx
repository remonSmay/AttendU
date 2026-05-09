import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconCheck, IconX, IconAlertCircle } from './Icons'

export type SnackbarVariant = 'success' | 'error' | 'info' | 'warning'

export interface SnackbarMessage {
  id: string
  message: string
  variant: SnackbarVariant
}

let snackbarIdCounter = 0

// A simple store to allow triggering snackbars from anywhere, especially hooks
type Listener = (message: SnackbarMessage) => void
let listeners: Listener[] = []

export const snackbarStore = {
  subscribe(listener: Listener) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },
  show(message: string, variant: SnackbarVariant = 'info') {
    const id = `snackbar-${++snackbarIdCounter}`
    const msg = { id, message, variant }
    listeners.forEach((listener) => listener(msg))
  },
  success(message: string) { this.show(message, 'success') },
  error(message: string) { this.show(message, 'error') },
  info(message: string) { this.show(message, 'info') },
  warning(message: string) { this.show(message, 'warning') },
}

export function SnackbarProvider() {
  const [messages, setMessages] = useState<SnackbarMessage[]>([])

  useEffect(() => {
    const unsubscribe = snackbarStore.subscribe((msg) => {
      setMessages((prev) => [...prev, msg])
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id))
      }, 5000)
    })
    return unsubscribe
  }, [])

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  if (messages.length === 0) return null

  return createPortal(
    <div className="ui-snackbar-container" style={{ position: 'fixed', bottom: 0, right: 0, padding: 'var(--space-4)', zIndex: 8000, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {messages.map((msg) => (
        <div key={msg.id} className={`ui-snackbar ui-snackbar--${msg.variant}`} style={{ position: 'relative', bottom: 'auto', right: 'auto' }}>
          <div className="ui-snackbar__icon" aria-hidden="true">
            {msg.variant === 'success' && <IconCheck />}
            {msg.variant === 'error' && <IconX />}
            {msg.variant === 'warning' && <IconAlertCircle />}
            {msg.variant === 'info' && <IconAlertCircle />}
          </div>
          <p className="ui-snackbar__message">{msg.message}</p>
          <button type="button" className="ui-snackbar__close" onClick={() => removeMessage(msg.id)} aria-label="Close">
            <IconX size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
