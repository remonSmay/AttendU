import {
  startTransition,
  useEffect,
  useDeferredValue,
  useMemo,
  useState,
} from 'react'

import PageHeader from '../components/ui/PageHeader'
import TableSkeleton from '../components/ui/TableSkeleton'
import EmptyState from '../components/admin/EmptyState'
import {
  getStudents,
  type StudentResponse,
} from '../features/admin/api/studentsAdminApi'
import { useTopbarSetter } from '../context/TopbarContext'
import './AllStudentsPage.css'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const IconClear = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AllStudentsPage() {
  const setTopbar = useTopbarSetter()
  const [students, setStudents] = useState<StudentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawQuery, setRawQuery] = useState('')
  const query = useDeferredValue(rawQuery)

  useEffect(() => {
    setTopbar({
      kicker: 'Directory',
      title: 'Students',
      description: 'All enrolled students',
    })
  }, [setTopbar])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    getStudents(0, 200)
      .then((data) => {
        if (!cancelled) {
          setStudents(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load students.')
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return students
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q) ||
        s.rfid_uid.toLowerCase().includes(q),
    )
  }, [students, query])

  const clearQuery = () => {
    startTransition(() => setRawQuery(''))
  }

  return (
    <div className="all-students-page">
      <section className="ui-surface ui-section">
        <PageHeader
          eyebrow="Search"
          title="Find a student"
          actions={(
            <div className="asp__search-wrap">
              <span className="asp__search-icon" aria-hidden="true">
                <IconSearch />
              </span>
              <input
                className="asp__search"
                type="search"
                placeholder="Name, email, phone or RFID…"
                value={rawQuery}
                onChange={(e) => startTransition(() => setRawQuery(e.target.value))}
                aria-label="Search students"
              />
              {rawQuery && (
                <button
                  className="asp__search-clear"
                  type="button"
                  onClick={clearQuery}
                  aria-label="Clear search"
                >
                  <IconClear />
                </button>
              )}
            </div>
          )}
        />

        {error && (
          <div className="asp__error" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="asp__table-shell">
            <TableSkeleton columns={4} rows={8} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={query ? 'No students match your search' : 'No students found'}
            description={query ? 'Try a different name, email, or RFID.' : 'Students will appear here once they are enrolled.'}
          />
        ) : (
          <div className="asp__table-shell">
            <table className="asp__table" aria-label="Students directory">
              <thead>
                <tr>
                  <th className="asp__th">Student</th>
                  <th className="asp__th asp__th--hide-sm">Email</th>
                  <th className="asp__th asp__th--hide-sm">Phone</th>
                  <th className="asp__th asp__th--hide-md">RFID UID</th>
                  <th className="asp__th asp__th--hide-lg">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <tr
                    key={student.id}
                    className="asp__row"
                    style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                  >
                    <td className="asp__td">
                      <div className="asp__identity">
                        <span className="asp__avatar" aria-hidden="true">
                          {getInitials(student.full_name)}
                        </span>
                        <span className="asp__name">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="asp__td asp__td--hide-sm asp__td--muted">
                      {student.email}
                    </td>
                    <td className="asp__td asp__td--hide-sm asp__td--muted">
                      {student.phone ?? <span className="asp__empty-cell">—</span>}
                    </td>
                    <td className="asp__td asp__td--hide-md">
                      <code className="asp__rfid">{student.rfid_uid}</code>
                    </td>
                    <td className="asp__td asp__td--hide-lg asp__td--muted">
                      {formatDate(student.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="asp__count">
              {filtered.length === students.length
                ? `${students.length} student${students.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${students.length} students`}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
