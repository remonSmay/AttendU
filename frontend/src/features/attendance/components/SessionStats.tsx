import type { AttendanceSessionResponse } from '../types/attendanceSessionTypes'
import './SessionStats.css'

export interface SessionStatsProps {
  session: AttendanceSessionResponse
  presentCount: number
}

const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 11a4 4 0 0 1-8 0" />
    <path d="M12 15c-4.4 0-8 2.2-8 5" />
    <path d="M20 20c0-2.3-2.4-4.2-5.6-4.8" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconCheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 12 2 2 4-4" />
    <circle cx="12" cy="12" r="9" />
  </svg>
)

const IconXCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
    <circle cx="12" cy="12" r="9" />
  </svg>
)

const getTotalStudents = (session: AttendanceSessionResponse): number => {
  const totalStudents = session.total_students
  if (typeof totalStudents !== 'number' || Number.isNaN(totalStudents)) {
    return 0
  }

  return Math.max(0, totalStudents)
}

export function SessionStats({ session, presentCount }: SessionStatsProps) {
  const totalStudents = getTotalStudents(session)
  const absentCount = Math.max(totalStudents - presentCount, 0)
  const cards = [
    {
      label: 'Total Students',
      value: totalStudents,
      meta: 'From class roster',
      tone: 'neutral',
      icon: <IconUsers />,
    },
    {
      label: 'Attended',
      value: presentCount,
      meta: 'Since session start',
      tone: 'success',
      icon: <IconCheckCircle />,
    },
    {
      label: 'Absent',
      value: absentCount,
      meta: 'Estimated remaining',
      tone: 'danger',
      icon: <IconXCircle />,
    },
  ]

  return (
    <section className="session-stats" aria-label="Session statistics">
      <div className="session-stats-grid">
        {cards.map((card) => (
          <article key={card.label} className={`session-stat-card session-stat-card--${card.tone}`}>
            <div className="session-stat-card__icon" aria-hidden="true">
              {card.icon}
            </div>
            <div className="session-stat-card__body">
              <p className="session-stat-card__label">{card.label}</p>
              <p className="session-stat-card__value">{card.value}</p>
              <p className="session-stat-card__meta">{card.meta}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
