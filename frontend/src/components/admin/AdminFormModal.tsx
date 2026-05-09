import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import FeedbackBanner from '../ui/FeedbackBanner'
import './Modal.css'

interface AdminFormModalProps {
  isOpen: boolean
  title: string
  description?: string
  submitLabel: string
  cancelLabel?: string
  isSubmitting?: boolean
  errorMessage?: string | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

export default function AdminFormModal({
  isOpen,
  title,
  description,
  submitLabel,
  cancelLabel = 'Cancel',
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
  children,
}: AdminFormModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const isSubmittingRef = useRef(isSubmitting)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { isSubmittingRef.current = isSubmitting }, [isSubmitting])

  // Focus the first input only when the modal first opens
  useEffect(() => {
    if (!isOpen) return
    const firstInput = panelRef.current?.querySelector('input, select, textarea') as HTMLElement | null
    if (firstInput) {
      const id = setTimeout(() => firstInput.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [isOpen])

  // Escape key handler — uses refs so it never needs to re-register
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmittingRef.current) {
        onCloseRef.current()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="admin-modal-overlay ui-modal-bottom-sheet" onClick={onClose} style={{ zIndex: 9000 }}>
      <div
        ref={panelRef}
        className="admin-modal-panel ui-surface admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
        style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-2xl)', maxWidth: '32rem', width: '100%' }}
      >
        <div className="admin-modal-header" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 id="modal-title" className="admin-modal-title" style={{ margin: 0, fontSize: 'var(--type-title-lg-size)' }}>{title}</h3>
          {description && <p className="admin-modal-description" style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-muted)' }}>{description}</p>}
        </div>

        <form onSubmit={onSubmit}>
          <div className="admin-modal-body" style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            {errorMessage && (
              <FeedbackBanner variant="error" description={errorMessage} />
            )}
            {children}
          </div>
          <div className="admin-modal-actions" style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="ui-button ui-button--secondary" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
            <button 
              type="submit" 
              className={`ui-button ${isSubmitting ? 'is-loading' : ''}`} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="ui-button__spinner" aria-hidden="true" />
                  Submitting...
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
