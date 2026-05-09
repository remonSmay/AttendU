import { useEffect } from 'react'
import './Modal.css'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isConfirming, isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div className="admin-modal-overlay ui-modal-bottom-sheet" onClick={onCancel} style={{ zIndex: 9000 }}>
      <div
        className="admin-modal-panel admin-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 id="confirm-modal-title" className="admin-modal-title">{title}</h3>
          <p className="admin-modal-description">{message}</p>
        </div>

        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-cancel" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button type="button" className="admin-modal-danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Removing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
