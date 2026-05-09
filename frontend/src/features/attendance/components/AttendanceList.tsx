import { useMemo, useState } from 'react'

import type { AttendanceSocketMessage } from '../../../hooks/useAttendanceSocket'
import './AttendanceList.css'

export interface AttendanceListProps {
  presentStudents: AttendanceSocketMessage[]
  totalStudents: number
  isConnected: boolean
  query?: string
}

const formatTimestamp = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatBadgeValue = (value: string | undefined): string =>
  value ? value.toUpperCase() : '--'

const getMethodClassName = (value: string | undefined): string => {
  const normalized = formatBadgeValue(value)
  if (normalized === 'RFID') return 'method-rfid'
  if (normalized === 'FACE') return 'method-face'
  if (normalized === 'MANUAL') return 'method-manual'
  return 'method-generic'
}

const getStatusClassName = (value: string | undefined): string => {
  const normalized = formatBadgeValue(value)
  if (normalized === 'PRESENT') return 'status-present'
  if (normalized === 'LATE') return 'status-late'
  if (normalized === 'ABSENT') return 'status-absent'
  return 'status-generic'
}

const getInitials = (value: string): string => {
  const parts = value.split(' ').filter(Boolean)
  if (parts.length === 0) {
    return '--'
  }

  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${second}`.toUpperCase()
}

const buildCsvValue = (value: string): string => `"${value.replace(/"/g, '""')}"`

export function AttendanceList({ presentStudents, totalStudents, isConnected, query = '' }: AttendanceListProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const rows = useMemo(() => [...presentStudents].reverse(), [presentStudents])
  const presentCount = presentStudents.length
  const normalizedQuery = query.trim().toLowerCase()

  const filteredRows = useMemo(() => {
    return rows.filter((entry) => {
      const matchesStatus =
        statusFilter === 'all' || formatBadgeValue(entry.status).toLowerCase() === statusFilter

      if (!normalizedQuery) {
        return matchesStatus
      }

      const haystack = [
        entry.student_name,
        entry.student_id,
        entry.method,
        entry.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesStatus && haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery, rows, statusFilter])

  const handleExport = () => {
    if (filteredRows.length === 0) {
      return
    }

    const header = ['Name', 'Student ID', 'Check-in Time', 'Method', 'Status']
    const lines = filteredRows.map((entry) => [
      entry.student_name,
      entry.student_id,
      formatTimestamp(entry.timestamp),
      formatBadgeValue(entry.method),
      formatBadgeValue(entry.status),
    ])

    const csvContent = [header, ...lines]
      .map((row) => row.map((value) => buildCsvValue(String(value))).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'attendance-checkins.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="attendance-list" aria-live="polite">
      <header className="attendance-list-header">
        <div>
          <p className="attendance-list-kicker">Live attendance</p>
          <h3>Real-time Check-ins</h3>
          <p className="attendance-list-description">Track verified check-ins the moment they arrive.</p>
        </div>

        <div className="attendance-list-actions">
          <div className={`attendance-list-pill ${isConnected ? 'is-online' : 'is-offline'}`}>
            <span className="attendance-list-pill-dot" aria-hidden="true" />
            {isConnected ? 'Live' : 'Offline'}
          </div>
          <label className="attendance-list-filter">
            <span className="attendance-list-filter-label">Filter</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </label>
          <button
            className="attendance-list-export"
            type="button"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
          >
            Export
          </button>
        </div>
      </header>

      <div className="attendance-list-table">
        <table aria-label="Attendance check-ins">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">ID Number</th>
              <th scope="col">Check-in Time</th>
              <th scope="col">Method</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="attendance-list-empty" colSpan={5}>
                  No check-ins yet.
                </td>
              </tr>
            ) : (
              filteredRows.map((entry, index) => {
                const methodLabel = formatBadgeValue(entry.method)
                const statusLabel = formatBadgeValue(entry.status)
                const rowKey = `${entry.student_id}-${entry.timestamp}-${index}`

                return (
                  <tr key={rowKey}>
                    <td>
                      <div className="attendance-list-student">
                        <span className="attendance-list-avatar" aria-hidden="true">
                          {getInitials(entry.student_name)}
                        </span>
                        <span className="attendance-list-name">{entry.student_name}</span>
                      </div>
                    </td>
                    <td className="attendance-list-muted">{entry.student_id}</td>
                    <td className="attendance-list-muted">{formatTimestamp(entry.timestamp)}</td>
                    <td>
                      <span className={`attendance-list-badge ${getMethodClassName(entry.method)}`}>
                        {methodLabel}
                      </span>
                    </td>
                    <td>
                      <span className={`attendance-list-badge ${getStatusClassName(entry.status)}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="attendance-list-footer">
        <span>
          Showing {filteredRows.length} of {presentCount} present students
        </span>
        <span className="attendance-list-total">
          {presentCount} / {totalStudents} present
        </span>
      </footer>
    </section>
  )
}
