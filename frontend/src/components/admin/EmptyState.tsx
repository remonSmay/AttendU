import type { ReactNode } from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export default function EmptyState({ title, description, actionLabel, onAction, children }: EmptyStateProps) {
  return (
    <section className="ui-empty admin-empty-state" aria-live="polite">
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  )
}
