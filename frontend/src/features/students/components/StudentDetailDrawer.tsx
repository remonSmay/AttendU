import { useEffect, useMemo } from 'react'

import type { CourseStudentAttendanceResponse } from '../../courses/types/courseTypes'
import './StudentDetailDrawer.css'

interface StudentDetailDrawerProps {
  student: CourseStudentAttendanceResponse | null
  onClose: () => void
}

interface StudentAttendanceHistoryEntry {
  id: string
  sessionLabel: string
  checkedInAt: string
  status: 'Present' | 'Absent' | 'Late'
  method: 'RFID' | 'Manual' | 'RFID + Face'
}

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
)

const getStudentInitials = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

const formatAttendance = (attendancePercentage: number) =>
  `${attendancePercentage.toFixed(1)}%`

const buildMockAttendanceHistory = (
  student: CourseStudentAttendanceResponse,
): StudentAttendanceHistoryEntry[] => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const historyTemplates: Array<Pick<StudentAttendanceHistoryEntry, 'status' | 'method'>> = [
    { status: 'Present', method: 'RFID' },
    { status: student.attendance_percentage < 75 ? 'Late' : 'Present', method: 'RFID + Face' },
    { status: student.attendance_percentage < 60 ? 'Absent' : 'Present', method: 'Manual' },
    { status: 'Present', method: 'RFID' },
    { status: student.attendance_percentage < 50 ? 'Absent' : 'Present', method: 'RFID + Face' },
  ]

  return historyTemplates.map((entry, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (index + 1) * 4)
    date.setHours(9 + (index % 3), 15, 0, 0)

    return {
      id: `${student.id}-${index}`,
      sessionLabel: `Week ${index + 1} attendance`,
      checkedInAt: formatter.format(date),
      status: entry.status,
      method: entry.method,
    }
  })
}

export default function StudentDetailDrawer({
  student,
  onClose,
}: StudentDetailDrawerProps) {
  useEffect(() => {
    if (!student) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, student])

  const attendanceHistory = useMemo(
    () => (student ? buildMockAttendanceHistory(student) : []),
    [student],
  )

  if (!student) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="student-detail-drawer__backdrop"
        aria-label="Close student details"
        onClick={onClose}
      />
      <aside
        className="student-detail-drawer"
        aria-labelledby="student-detail-title"
        aria-modal="true"
        role="dialog"
      >
        <div className="student-detail-drawer__header">
          <div className="student-detail-drawer__title">
            <p className="ui-auth-kicker">Student detail</p>
            <h2 id="student-detail-title">{student.full_name}</h2>
          </div>
          <button
            type="button"
            className="student-detail-drawer__close"
            onClick={onClose}
            aria-label="Close student details"
          >
            <IconClose />
          </button>
        </div>

        <div className="student-detail-drawer__body">
          <div className="student-detail-drawer__hero">
            <div className="student-detail-drawer__avatar" aria-hidden="true">
              {getStudentInitials(student.full_name)}
            </div>
            <div className="student-detail-drawer__hero-copy">
              <p className="student-detail-drawer__attendance-label">Current attendance</p>
              <strong>{formatAttendance(student.attendance_percentage)}</strong>
            </div>
          </div>

          <section className="student-detail-drawer__section">
            <h3>Student information</h3>
            <dl className="student-detail-drawer__details">
              <div>
                <dt>Name</dt>
                <dd>{student.full_name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{student.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{student.phone || 'No phone on record'}</dd>
              </div>
              <div>
                <dt>RFID UID</dt>
                <dd>{student.rfid_uid}</dd>
              </div>
            </dl>
          </section>

          <section className="student-detail-drawer__section">
            <div className="student-detail-drawer__section-header">
              <div>
                <h3>Attendance history</h3>
                <p>Mocked until `GET /api/v1/students/:id/attendance` is implemented.</p>
              </div>
              <span className="ui-badge">Mock data</span>
            </div>

            <div className="student-detail-drawer__table-wrap">
              <table className="student-detail-drawer__table">
                <thead>
                  <tr>
                    <th scope="col">Session</th>
                    <th scope="col">Check-in time</th>
                    <th scope="col">Status</th>
                    <th scope="col">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.sessionLabel}</td>
                      <td>{entry.checkedInAt}</td>
                      <td>
                        <span
                          className={`student-detail-drawer__status student-detail-drawer__status--${entry.status.toLowerCase()}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td>{entry.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}
