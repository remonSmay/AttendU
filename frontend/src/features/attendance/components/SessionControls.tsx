import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { createSession, getActiveSessions, stopSession, preloadSessionFaces } from '../api/attendanceSessionApi'
import type {
  AttendanceSessionCreate,
  AttendanceSessionResponse,
  SessionVerificationMethod,
} from '../types/attendanceSessionTypes'
import { authStore } from '../../../store/authStore'
import './SessionControls.css'

export interface SessionControlsProps {
  sectionId: string
  title?: string
  description?: string
  onSessionChange?: (session: AttendanceSessionResponse | null) => void
}

const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 h',    value: 60 },
  { label: '1 h 30', value: 90 },
  { label: '2 h',    value: 120 },
]

const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours   = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((u) => String(u).padStart(2, '0')).join(':')
}

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function SessionControls({
  sectionId,
  title = 'Session Control',
  description = 'Open a live attendance window for this section.',
  onSessionChange,
}: SessionControlsProps) {
  const currentUser = authStore.getUser()

  const [sessionTitle, setSessionTitle]       = useState('')
  const [durationMin, setDurationMin]         = useState(60)
  const [customDuration, setCustomDuration]   = useState('')
  const [isCustom, setIsCustom]               = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<SessionVerificationMethod>('RFID')

  const [activeSession, setActiveSession]     = useState<AttendanceSessionResponse | null>(null)
  const [isLoading, setIsLoading]             = useState(true)
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [now, setNow]                         = useState(() => Date.now())

  /* ── Load active session on mount ── */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const sessions = await getActiveSessions()
        const match = sessions.find((s) => s.section_id === sectionId) ?? null
        if (!cancelled) {
          setActiveSession(match)
          onSessionChange?.(match)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load session.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [onSessionChange, sectionId])

  /* ── Tick while session is active ── */
  useEffect(() => {
    if (!activeSession) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [activeSession])

  const countdown = useMemo(() => {
    if (!activeSession) return null
    return formatCountdown(new Date(activeSession.end_time).getTime() - now)
  }, [activeSession, now])

  /* Progress 0→1 for the ring */
  const countdownProgress = useMemo(() => {
    if (!activeSession) return 0
    const total = new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime()
    const remaining = new Date(activeSession.end_time).getTime() - now
    if (total <= 0) return 0
    return Math.max(0, Math.min(1, remaining / total))
  }, [activeSession, now])

  /* Effective duration (minutes) */
  const effectiveDuration = useMemo(() => {
    if (!isCustom) return durationMin
    const v = parseInt(customDuration, 10)
    return Number.isFinite(v) && v > 0 ? v : 0
  }, [isCustom, durationMin, customDuration])

  /* ── Handlers ── */
  const selectPreset = (value: number) => {
    setIsCustom(false)
    setDurationMin(value)
  }

  const handleCreateSession = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentUser) { setError('You must be logged in to start a session.'); return }
    if (!sessionTitle.trim()) { setError('Session title is required.'); return }
    if (effectiveDuration <= 0) { setError('Please set a valid duration.'); return }

    const startTime = new Date()
    const endTime   = new Date(startTime.getTime() + effectiveDuration * 60_000)

    const payload: AttendanceSessionCreate = {
      section_id:    sectionId,
      created_by_id: String(currentUser.id),
      title:         sessionTitle.trim(),
      start_time:    startTime.toISOString(),
      end_time:      endTime.toISOString(),
      verification_method: verificationMethod,
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const created = await createSession(payload)
      
      // If RFID_FACE, preload face encodings
      if (verificationMethod === 'RFID_FACE') {
        try {
          await preloadSessionFaces(created.id)
        } catch (preloadErr) {
          console.warn('Failed to preload faces:', preloadErr)
          // Non-fatal, we continue
        }
      }

      setActiveSession(created)
      setNow(Date.now())
      setSessionTitle('')
      onSessionChange?.(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStopSession = async () => {
    if (!activeSession) return
    setIsSubmitting(true)
    setError(null)
    try {
      await stopSession(activeSession.id)
      setActiveSession(null)
      onSessionChange?.(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop session.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── SVG ring dimensions ── */
  const RADIUS = 42
  const CIRC   = 2 * Math.PI * RADIUS

  return (
    <section className="session-controls" aria-live="polite">

      {/* Header */}
      <div className="session-controls-header">
        <div>
          <h3>{title}</h3>
          <p className="session-controls-description">{description}</p>
        </div>
        <span className={`session-controls-status ${activeSession ? 'active' : 'idle'}`}>
          {activeSession && <span className="session-controls-status-dot" aria-hidden="true" />}
          {activeSession ? 'Active' : 'Idle'}
        </span>
      </div>

      {/* Error / loading feedback */}
      {error    && <p className="session-controls-feedback error">{error}</p>}
      {isLoading && <p className="session-controls-feedback info">Checking session status…</p>}

      {/* ── Create form ── */}
      {!isLoading && !activeSession && (
        <form className="session-controls-form" onSubmit={handleCreateSession}>

          {/* Title */}
          <div className="sc-field">
            <label htmlFor={`sc-title-${sectionId}`}>Session title</label>
            <input
              id={`sc-title-${sectionId}`}
              type="text"
              className="sc-input"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Week 9 — Lecture"
              maxLength={120}
              required
            />
          </div>

          {/* Duration */}
          <div className="sc-field">
            <label>Duration</label>

            {/* Preset chips */}
            <div className="sc-duration-chips" role="group" aria-label="Duration presets">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`sc-chip ${!isCustom && durationMin === p.value ? 'is-active' : ''}`}
                  onClick={() => selectPreset(p.value)}
                  aria-pressed={!isCustom && durationMin === p.value}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className={`sc-chip ${isCustom ? 'is-active' : ''}`}
                onClick={() => setIsCustom(true)}
                aria-pressed={isCustom}
              >
                Custom
              </button>
            </div>

            {/* Custom input */}
            {isCustom && (
              <div className="sc-custom-wrap">
                <input
                  className="sc-input sc-custom-input"
                  type="number"
                  min="1"
                  max="480"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="Enter minutes"
                  autoFocus
                />
                <span className="sc-custom-unit">min</span>
              </div>
            )}

            {/* Preview */}
            {effectiveDuration > 0 && (
              <p className="sc-duration-preview">
                Session will run for <strong>{formatDuration(effectiveDuration)}</strong>
              </p>
            )}
          </div>

          {/* Verification Method */}
          <div className="sc-field">
            <label htmlFor={`sc-method-${sectionId}`}>Verification Method</label>
            <select
              id={`sc-method-${sectionId}`}
              className="sc-input sc-select"
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value as SessionVerificationMethod)}
            >
              <option value="RFID">RFID Only</option>
              <option value="RFID_FACE">RFID + Face Verification</option>
              <option value="MANUAL">Manual Attendance Only</option>
            </select>
            {verificationMethod === 'RFID_FACE' && (
              <p className="sc-duration-preview" style={{ color: 'var(--primary)', marginTop: '8px' }}>
                Face encodings will be pre-loaded when the session starts.
              </p>
            )}
          </div>

          <button
            className="session-controls-button primary"
            type="submit"
            disabled={isSubmitting || effectiveDuration <= 0}
          >
            {isSubmitting ? 'Starting…' : 'Start Session'}
          </button>
        </form>
      )}

      {/* ── Active session card ── */}
      {!isLoading && activeSession && (
        <div className="session-controls-active-card">

          {/* Countdown ring */}
          <div className="sc-ring-wrap" aria-label={`Time remaining: ${countdown}`}>
            <svg className="sc-ring" viewBox="0 0 100 100" aria-hidden="true">
              {/* Track */}
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none"
                stroke="currentColor"
                className="sc-ring-track"
                strokeWidth="8"
              />
              {/* Progress arc */}
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none"
                className="sc-ring-progress"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - countdownProgress)}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="sc-ring-inner">
              <span className="sc-ring-label">remaining</span>
              <span className="sc-ring-time">{countdown}</span>
              <span className="sc-ring-dur">{formatDuration(
                Math.round(
                  (new Date(activeSession.end_time).getTime() -
                   new Date(activeSession.start_time).getTime()) / 60_000
                )
              )}</span>
            </div>
          </div>

          {/* Session info */}
          <div className="sc-active-info">
            <p className="sc-active-name">{activeSession.title}</p>
            <p className="sc-active-hint">
              Method: <strong>{activeSession.verification_method.replace('_', ' ')}</strong>
            </p>
            <p className="sc-active-hint">
              Started{' '}
              {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(
                new Date(activeSession.start_time),
              )}
              {' · '}
              Ends{' '}
              {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(
                new Date(activeSession.end_time),
              )}
            </p>
          </div>

          <button
            className="session-controls-button stop"
            type="button"
            onClick={handleStopSession}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Stopping…' : 'Stop Session'}
          </button>
        </div>
      )}
    </section>
  )
}

export default SessionControls
