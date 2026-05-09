import type { ReactNode } from 'react'

import Button from './Button'
import { IconAlertCircle } from './Icons'

interface FeedbackBannerProps {
  variant: 'error' | 'empty' | 'info' | 'success'
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export default function FeedbackBanner({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: FeedbackBannerProps) {
  if (variant === 'error') {
    return (
      <section className="ui-alert ui-alert--error" role="alert">
        <div className="ui-alert__copy">
          {title && <p className="ui-alert__title">{title}</p>}
          <p className="ui-alert__content">{description}</p>
        </div>
        {actionLabel && onAction && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </section>
    )
  }

  return (
    <section className="ui-empty" aria-live="polite">
      {icon ? (
        <span className="ui-empty__icon" aria-hidden="true">{icon}</span>
      ) : variant === 'info' ? (
        <IconAlertCircle size={32} />
      ) : null}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <div className="ui-empty__actions">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </section>
  )
}
