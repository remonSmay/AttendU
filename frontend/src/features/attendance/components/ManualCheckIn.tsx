import { useEffect, useMemo, useRef, useState } from 'react'

import { manualCheckIn, searchStudents } from '../api/attendanceCheckinApi'
import type { StudentSearchResult } from '../types/attendanceCheckinTypes'
import type { AttendanceSocketMessage } from '../../../hooks/useAttendanceSocket'
import './ManualCheckIn.css'

export interface ManualCheckInProps {
  sessionId: string
  sectionId: string
  deviceId: string
  onCheckInAccepted?: (entry: AttendanceSocketMessage) => void
}

type ToastState = {
  type: 'success' | 'error'
  message: string
}

export function ManualCheckIn({
  sessionId,
  sectionId,
  deviceId,
  onCheckInAccepted,
}: ManualCheckInProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<StudentSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => window.clearTimeout(handler)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)
    setErrorMessage(null)

    searchStudents(debouncedQuery)
      .then((data) => {
        if (requestIdRef.current !== requestId) {
          return
        }

        setResults(data)
      })
      .catch((error) => {
        if (requestIdRef.current !== requestId) {
          return
        }

        setResults([])
        setErrorMessage(error instanceof Error ? error.message : 'Search failed.')
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      })
  }, [debouncedQuery])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timerId = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timerId)
  }, [toast])

  const hasResults = results.length > 0
  const showDropdown = query.trim().length > 0

  const statusLabel = useMemo(() => {
    if (!debouncedQuery) {
      return 'Start typing to search for a student.'
    }

    if (isLoading) {
      return 'Searching students...'
    }

    if (errorMessage) {
      return errorMessage
    }

    if (!hasResults) {
      return 'No matching students found.'
    }

    return `Showing ${results.length} result${results.length === 1 ? '' : 's'}.`
  }, [debouncedQuery, errorMessage, hasResults, isLoading, results.length])

  const handleSelectStudent = async (student: StudentSearchResult) => {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await manualCheckIn({
        student_id: student.id,
        attendance_session_id: sessionId,
        section_id: sectionId,
        device_id: deviceId,
        method_used: 'MANUAL',
      })

      if (result.accepted) {
        onCheckInAccepted?.({
          type: 'checkin',
          student_id: student.id,
          student_name: student.full_name,
          method: result.attendance_event?.method_used ?? 'MANUAL',
          status: result.attendance_event?.final_status ?? 'Present',
          timestamp: result.attendance_event?.created_at ?? result.checked_at,
        })

        setToast({
          type: 'success',
          message: `${student.full_name} checked in successfully.`,
        })
        setQuery('')
        setDebouncedQuery('')
        setResults([])
        setErrorMessage(null)
      } else {
        setToast({
          type: 'error',
          message: `Rejected: ${result.reason}`,
        })
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Check-in failed.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="manual-checkin" aria-live="polite">
      <header className="manual-checkin-header">
        <div>
          <p className="manual-checkin-kicker">Manual check-in</p>
          <h3>Find a student</h3>
          <p className="manual-checkin-description">
            Search by name or RFID and confirm attendance manually for this session.
          </p>
        </div>
        <span className="manual-checkin-status">Method: Manual</span>
      </header>

      <div className="manual-checkin-field">
        <label htmlFor="manual-checkin-search">Student search</label>
        <div className="manual-checkin-input-wrap">
          <input
            id="manual-checkin-search"
            type="search"
            value={query}
            placeholder="Type a name or RFID"
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          {isLoading ? <span className="manual-checkin-spinner" aria-hidden="true" /> : null}
        </div>
        <p className={`manual-checkin-status-text ${errorMessage ? 'error' : ''}`}>{statusLabel}</p>
      </div>

      {showDropdown ? (
        <div className="manual-checkin-results" id="manual-checkin-results">
          {hasResults ? (
            results.map((student) => (
              <button
                key={student.id}
                type="button"
                className="manual-checkin-result"
                onClick={() => handleSelectStudent(student)}
                disabled={isSubmitting}
              >
                <span className="manual-checkin-result-name">{student.full_name}</span>
                <span className="manual-checkin-result-rfid">RFID {student.rfid_uid}</span>
              </button>
            ))
          ) : (
            <div className="manual-checkin-empty">No matching students.</div>
          )}
        </div>
      ) : null}

      {toast ? (
        <div className={`manual-checkin-toast ${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}
    </section>
  )
}
