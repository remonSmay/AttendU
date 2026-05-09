import { useEffect, useRef } from 'react'
import type { SectionApiResponse, StudentApiResponse } from '../../features/admin/types/adminApiTypes'
import './StudentDetailModal.css'

interface StudentDetailModalProps {
  student: StudentApiResponse | null
  sections: SectionApiResponse[]
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onAddFaceImage: () => void
}

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function StudentDetailModal({
  student,
  sections,
  isOpen,
  onClose,
  onEdit,
  onAddFaceImage,
}: StudentDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  if (!isOpen || !student) return null

  const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s]))
  const enrolledSections = (student.section_ids ?? []).map((id) => sectionMap[id]).filter(Boolean)

  return (
    <div
      className="sdm-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${student.full_name} profile`}
    >
      <div
        ref={panelRef}
        className="sdm-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sdm-header">
          <div className="sdm-avatar" aria-hidden="true">
            {getInitials(student.full_name)}
          </div>

          <div className="sdm-identity">
            <h2 className="sdm-name">{student.full_name}</h2>
            <p className="sdm-email">{student.email}</p>
          </div>

          <button
            type="button"
            className="sdm-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="sdm-body">

          {/* Info grid */}
          <div className="sdm-info-grid">
            <div className="sdm-info-item">
              <span className="sdm-info-label">Phone</span>
              <span className="sdm-info-value">{student.phone ?? '—'}</span>
            </div>

            <div className="sdm-info-item">
              <span className="sdm-info-label">RFID UID</span>
              <span className="sdm-info-value sdm-mono">
                {student.rfid_uid || '—'}
              </span>
            </div>

            <div className="sdm-info-item">
              <span className="sdm-info-label">Enrolled Sections</span>
              <span className="sdm-info-value">{enrolledSections.length}</span>
            </div>

            <div className="sdm-info-item">
              <span className="sdm-info-label">Member since</span>
              <span className="sdm-info-value">
                {student.created_at ? formatDate(student.created_at) : '—'}
              </span>
            </div>
          </div>

          {/* Sections */}
          {enrolledSections.length > 0 && (
            <div className="sdm-section">
              <h4 className="sdm-section-title">Enrolled Sections</h4>
              <div className="sdm-chip-list">
                {enrolledSections.map((section) => (
                  <span key={section.id} className="sdm-chip">
                    {section.section_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {enrolledSections.length === 0 && (
            <div className="sdm-empty-sections">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M9 12h6M12 9v6" />
              </svg>
              <p>Not enrolled in any sections yet</p>
            </div>
          )}

          {/* Face image */}
          <div className="sdm-section">
            <div className="sdm-section-header">
              <h4 className="sdm-section-title">Face Reference</h4>
              <button type="button" className="sdm-face-action" onClick={onAddFaceImage}>
                {student.face_reference_image ? 'Replace image' : 'Add face image'}
              </button>
            </div>

            {student.face_reference_image ? (
              <img
                src={student.face_reference_image}
                alt={`${student.full_name} face reference`}
                className="sdm-face-img"
              />
            ) : (
              <div className="sdm-face-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 14v6" />
                  <path d="M9 18h6" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
                <p>No face image has been registered yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sdm-footer">
          <button type="button" className="ui-button ui-button--secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="ui-button" onClick={onEdit}>
            Edit Student
          </button>
        </div>
      </div>
    </div>
  )
}
