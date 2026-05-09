import { useEffect, useMemo, useState } from 'react'

import { ManualCheckIn } from '../features/attendance/components/ManualCheckIn'
import { AttendanceList } from '../features/attendance/components/AttendanceList'
import SessionControls from '../features/attendance/components/SessionControls'
import { SessionStats } from '../features/attendance/components/SessionStats'
import type { AttendanceSessionResponse } from '../features/attendance/types/attendanceSessionTypes'
import { listDevicesAdmin } from '../features/admin/api/devicesAdminApi'
import type { DeviceApiResponse } from '../features/admin/types/adminApiTypes'
import { getSections } from '../features/sections/api/sectionApi'
import type { SectionResponse } from '../features/sections/types/sectionTypes'
import { useAttendanceSocket } from '../hooks/useAttendanceSocket'
import { useTopbarSetter } from '../context/TopbarContext'
import './SessionPage.css'

const IconTimer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M12 2v2" /><circle cx="12" cy="14" r="8" /></svg>
)

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
)

const IconWifi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8.82a15 15 0 0 1 20 0" /><path d="M5 12.87a10 10 0 0 1 14 0" /><path d="M8.5 16.9a5 5 0 0 1 7 0" /><line x1="12" y1="21" x2="12.01" y2="21" /></svg>
)

const IconSection = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
)

const IconDevice = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
)

const formatElapsed = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':')
}

const DAY_DISPLAY: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
}

const formatSchedule = (value: string): string => {
  const parts = value.trim().split(' ')
  if (parts.length === 2 && DAY_DISPLAY[parts[0]]) {
    return `${DAY_DISPLAY[parts[0]]} · ${parts[1]}`
  }
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }
  return value
}

export default function SessionPage() {
  const [sections, setSections] = useState<SectionResponse[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken] = useState(0)
  const [activeSession, setActiveSession] = useState<AttendanceSessionResponse | null>(null)
  const [devices, setDevices] = useState<DeviceApiResponse[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isDeviceLoading, setIsDeviceLoading] = useState(true)
  const [checkinSearch, setCheckinSearch] = useState('')
  const [checkInMode, setCheckInMode] = useState<'rfid' | 'rfid_face' | 'manual'>('manual')
  const [sessionNow, setSessionNow] = useState(() => Date.now())
  const setTopbar = useTopbarSetter()

  const { presentStudents, totalStudents, isConnected, connectionError, addLocalCheckin } = useAttendanceSocket(
    activeSession?.id ?? null,
  )

  useEffect(() => {
    setTopbar({
      title: (
        <div className="session-topbar-title">
          Live Session
          <span className={`session-topbar-pill ${activeSession ? 'is-active' : 'is-idle'}`}>
            {activeSession ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      ),
    })
  }, [setTopbar, activeSession])

  useEffect(() => {
    let isActive = true
    const loadSections = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getSections()
        if (!isActive) return
        setSections(result)
        setSelectedSectionId((current) => {
          if (current && result.some((section) => section.id === current)) return current
          return result[0]?.id ?? ''
        })
      } catch (requestError) {
        if (!isActive) return
        setError(requestError instanceof Error ? requestError.message : 'Failed to load sections.')
        setSections([])
        setSelectedSectionId('')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    void loadSections()
    return () => { isActive = false }
  }, [reloadToken])

  useEffect(() => {
    if (!activeSession) return
    setSessionNow(Date.now())
    const timerId = window.setInterval(() => setSessionNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [activeSession])

  useEffect(() => {
    let isActive = true
    const loadDevices = async () => {
      setIsDeviceLoading(true)
      try {
        const result = await listDevicesAdmin()
        if (!isActive) return
        setDevices(result)
        setSelectedDeviceId((current) => {
          if (current && result.some((device) => device.id === current)) return current
          return result[0]?.id ?? ''
        })
      } catch {
        if (!isActive) return
        setDevices([])
        setSelectedDeviceId('')
      } finally {
        if (isActive) setIsDeviceLoading(false)
      }
    }
    void loadDevices()
    return () => { isActive = false }
  }, [reloadToken])

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  )

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  )

  const elapsedTime = useMemo(() => {
    if (!activeSession) return '--:--:--'
    const startTime = new Date(activeSession.start_time)
    if (Number.isNaN(startTime.getTime())) return '--:--:--'
    return formatElapsed(sessionNow - startTime.getTime())
  }, [activeSession, sessionNow])

  return (
    <div className="session-page">

      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="session-sidebar">

        {/* Section picker */}
        <div className="session-config-card">
          <div className="session-config-card__head">
            <span className="session-config-card__icon"><IconSection /></span>
            <span className="session-config-card__label">Section</span>
          </div>
          {isLoading ? (
            <p className="session-config-card__hint">Loading sections…</p>
          ) : error ? (
            <p className="session-config-card__hint session-config-card__hint--error">{error}</p>
          ) : (
            <select
              className="ui-select"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.section_name}</option>
              ))}
            </select>
          )}
          {selectedSection && (
            <div className="session-meta-grid">
              <span className="session-meta-key">Course</span>
              <span className="session-meta-val">{selectedSection.course_id.slice(0, 8)}…</span>
              <span className="session-meta-key">Schedule</span>
              <span className="session-meta-val">{formatSchedule(selectedSection.schedule_time)}</span>
            </div>
          )}
        </div>

        {/* Device picker */}
        <div className="session-config-card">
          <div className="session-config-card__head">
            <span className="session-config-card__icon"><IconDevice /></span>
            <span className="session-config-card__label">Device</span>
          </div>
          <select
            className="ui-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isDeviceLoading}
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.device_name}</option>
            ))}
          </select>
          {selectedDevice && (
            <div className="session-meta-grid">
              <span className="session-meta-key">Location</span>
              <span className="session-meta-val">{selectedDevice.location ?? 'Unknown'}</span>
            </div>
          )}
        </div>

        {/* Session control (start / stop) */}
        {selectedSection ? (
          <SessionControls
            sectionId={selectedSection.id}
            title="Session Control"
            description="Open a live attendance window for this section."
            onSessionChange={setActiveSession}
          />
        ) : (
          <div className="session-config-card session-config-card--muted">
            <p className="session-config-card__hint">Select a section to manage sessions.</p>
          </div>
        )}
      </aside>

      {/* ─── RIGHT MAIN ─── */}
      <div className="session-main">
        {activeSession ? (
          <>
            {/* Stats */}
            <SessionStats
              session={{ ...activeSession, total_students: totalStudents }}
              presentCount={presentStudents.length}
            />

            {/* Status bar */}
            <div className="session-status-bar">
              <div className="session-status-item">
                <span className="session-status-item__icon"><IconTimer /></span>
                <div>
                  <p className="session-status-item__label">Elapsed</p>
                  <p className="session-status-item__value">{elapsedTime}</p>
                </div>
              </div>

              <div className="session-status-divider" aria-hidden="true" />

              <div className="session-status-item">
                <span className="session-status-item__icon"><IconWifi /></span>
                <div>
                  <p className="session-status-item__label">WebSocket</p>
                  <p className={`session-status-item__value ${isConnected ? 'is-live' : 'is-offline'}`}>
                    {isConnected ? 'Connected' : 'Offline'}
                  </p>
                  {!isConnected && connectionError ? (
                    <p className="session-status-item__meta">{connectionError}</p>
                  ) : null}
                </div>
                <span className={`session-socket-dot ${isConnected ? '' : 'is-offline'}`} />
              </div>

              <div className="session-status-divider" aria-hidden="true" />

              {/* Mode toggle */}
              <div className="session-mode-wrap">
                <p className="session-status-item__label">Check-in Mode</p>
                <div className="session-mode-group">
                  {(['rfid', 'rfid_face', 'manual'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`session-mode-btn ${checkInMode === mode ? 'is-active' : ''}`}
                      onClick={() => setCheckInMode(mode)}
                    >
                      {mode === 'rfid' ? 'RFID' : mode === 'rfid_face' ? 'Hybrid' : 'Manual'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="session-search-bar">
              <span className="session-search-bar__icon" aria-hidden="true"><IconSearch /></span>
              <input
                type="search"
                className="ui-input session-search-bar__input"
                placeholder="Search attendance feed…"
                value={checkinSearch}
                onChange={(e) => setCheckinSearch(e.target.value)}
              />
            </div>

            {/* Manual check-in */}
            {selectedDeviceId ? (
              <ManualCheckIn
                sessionId={activeSession.id}
                sectionId={selectedSection?.id ?? ''}
                deviceId={selectedDeviceId}
                onCheckInAccepted={addLocalCheckin}
              />
            ) : (
              <div className="ui-alert ui-alert--error">Select a device to enable manual entries.</div>
            )}

            {/* Live list */}
            <AttendanceList
              presentStudents={presentStudents}
              totalStudents={totalStudents}
              isConnected={isConnected}
              query={checkinSearch}
            />
          </>
        ) : (
          <div className="session-idle-state">
            <div className="session-idle-state__graphic">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h3 className="session-idle-state__title">No Active Session</h3>
            <p className="session-idle-state__body">
              Pick a section and device on the left, then press <strong>Start Session</strong> to open a live attendance window.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
