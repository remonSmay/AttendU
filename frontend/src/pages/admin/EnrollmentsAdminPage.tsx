import { useCallback, useEffect, useMemo, useState } from 'react'

import type { AdminTopBarConfig } from '../../components/admin/AdminShell'
import DataTable, { type DataTableColumn } from '../../components/admin/DataTable'
import FeedbackBanner from '../../components/ui/FeedbackBanner'
import { listStudentsAdmin } from '../../features/admin/api/studentsAdminApi'
import {
  enrollStudentToSectionAdmin,
  listSectionsAdmin,
  listSectionStudentsAdmin,
  removeStudentFromSectionAdmin,
} from '../../features/admin/api/sectionsAdminApi'
import type {
  SectionApiResponse,
  StudentApiResponse,
} from '../../features/admin/types/adminApiTypes'
import { useSnackbar } from '../../hooks/useSnackbar'
import { useAdminPageConfig } from './useAdminPageConfig'
import './AdminPages.css'

interface EnrollmentStudentRow {
  id: string
  fullName: string
  email: string
  rfidUid: string
}

const toStudentRow = (student: StudentApiResponse): EnrollmentStudentRow => ({
  id: student.id,
  fullName: student.full_name,
  email: student.email,
  rfidUid: student.rfid_uid,
})

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
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export default function EnrollmentsAdminPage() {
  const [sections, setSections] = useState<SectionApiResponse[]>([])
  const [allStudents, setAllStudents] = useState<StudentApiResponse[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<StudentApiResponse[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isBootLoading, setIsBootLoading] = useState(true)
  const [isEnrollmentLoading, setIsEnrollmentLoading] = useState(false)
  const [activeEnrollStudentId, setActiveEnrollStudentId] = useState<string | null>(null)
  const [activeRemoveStudentId, setActiveRemoveStudentId] = useState<string | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const { showSnackbar } = useSnackbar()

  const pageConfig = useMemo<AdminTopBarConfig>(
    () => ({
      title: 'Enrollments',
      description: 'Connect students to sections with the same shared table, search, and action patterns used across admin.',
    }),
    [],
  )

  useAdminPageConfig(pageConfig)

  const loadBootstrap = useCallback(async () => {
    setIsBootLoading(true)
    setFeedbackError(null)

    try {
      const [sectionsResponse, studentsResponse] = await Promise.all([
        listSectionsAdmin(),
        listStudentsAdmin(),
      ])

      setSections(sectionsResponse)
      setAllStudents(studentsResponse)

      if (sectionsResponse.length > 0) {
        setSelectedSectionId((current) => current || sectionsResponse[0].id)
      } else {
        setSelectedSectionId('')
      }
    } catch (error) {
      setFeedbackError(
        error instanceof Error
          ? error.message
          : 'Failed to load enrollments dependencies.',
      )
      setSections([])
      setAllStudents([])
      setSelectedSectionId('')
    } finally {
      setIsBootLoading(false)
    }
  }, [])

  const loadEnrolledStudents = useCallback(async (sectionId: string) => {
    if (!sectionId) {
      setEnrolledStudents([])
      return
    }

    setIsEnrollmentLoading(true)
    setFeedbackError(null)

    try {
      const enrolled = await listSectionStudentsAdmin(sectionId)
      setEnrolledStudents(enrolled)
    } catch (error) {
      setFeedbackError(
        error instanceof Error
          ? error.message
          : 'Failed to load enrolled students.',
      )
      setEnrolledStudents([])
    } finally {
      setIsEnrollmentLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBootstrap()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadBootstrap])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadEnrolledStudents(selectedSectionId)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadEnrolledStudents, selectedSectionId])

  const enrolledRows = useMemo(
    () => enrolledStudents.map(toStudentRow),
    [enrolledStudents],
  )

  const enrolledStudentIds = useMemo(
    () => new Set(enrolledStudents.map((student) => student.id)),
    [enrolledStudents],
  )

  const availableRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return allStudents
      .filter((student) => !enrolledStudentIds.has(student.id))
      .filter((student) => {
        if (!query) {
          return true
        }

        return (
          student.full_name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.rfid_uid.toLowerCase().includes(query)
        )
      })
      .map(toStudentRow)
  }, [allStudents, enrolledStudentIds, searchTerm])

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  )

  const enrolledColumns = useMemo<DataTableColumn<EnrollmentStudentRow>[]>(
    () => [
      { id: 'fullName', header: 'Student', cell: (row) => row.fullName },
      { id: 'email', header: 'Email', cell: (row) => row.email },
      { id: 'rfidUid', header: 'RFID UID', cell: (row) => row.rfidUid },
    ],
    [],
  )

  const handleEnrollStudent = useCallback(
    async (studentId: string) => {
      if (!selectedSectionId || activeEnrollStudentId || activeRemoveStudentId) {
        return
      }

      setActiveEnrollStudentId(studentId)
      setFeedbackError(null)

      try {
        const enrolledStudent = await enrollStudentToSectionAdmin(
          selectedSectionId,
          studentId,
        )

        setEnrolledStudents((current) => {
          if (current.some((student) => student.id === enrolledStudent.id)) {
            return current
          }

          return [...current, enrolledStudent]
        })
        showSnackbar('Student enrolled successfully.', 'success')
      } catch (error) {
        showSnackbar(
          error instanceof Error ? error.message : 'Failed to enroll student.',
          'error'
        )
      } finally {
        setActiveEnrollStudentId(null)
      }
    },
    [activeEnrollStudentId, activeRemoveStudentId, selectedSectionId, showSnackbar],
  )

  const handleRemoveStudent = useCallback(
    async (row: EnrollmentStudentRow) => {
      if (!selectedSectionId || activeEnrollStudentId || activeRemoveStudentId) {
        return
      }

      setActiveRemoveStudentId(row.id)
      setFeedbackError(null)

      try {
        await removeStudentFromSectionAdmin(selectedSectionId, row.id)
        setEnrolledStudents((current) =>
          current.filter((student) => student.id !== row.id),
        )
        showSnackbar('Student removed from section successfully.', 'success')
      } catch (error) {
        showSnackbar(
          error instanceof Error
            ? error.message
            : 'Failed to remove student enrollment.',
          'error'
        )
      } finally {
        setActiveRemoveStudentId(null)
      }
    },
    [activeEnrollStudentId, activeRemoveStudentId, selectedSectionId, showSnackbar],
  )

  return (
    <div className="admin-page-stack">
      <section className="admin-page-note">
        <h3>Enrollment Connector</h3>
        <p>Choose a section, then add or remove students from that section enrollment list.</p>
      </section>

      {feedbackError && (
        <FeedbackBanner 
          variant="error" 
          title="Operation failed" 
          description={feedbackError} 
          actionLabel="Retry" 
          onAction={() => void loadBootstrap()} 
        />
      )}

      <section className="admin-page-note">
        <div className="admin-form-grid">
          <div className="ui-field">
            <div className="ui-field__header">
              <label className="ui-field__label">Select Section</label>
            </div>
            <select
              className="ui-input"
              value={selectedSectionId}
              onChange={(event) => setSelectedSectionId(event.target.value)}
              disabled={isBootLoading || sections.length === 0}
            >
              {sections.length === 0 ? (
                <option value="">No sections available</option>
              ) : (
                sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.section_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="ui-field">
            <div className="ui-field__header">
              <label className="ui-field__label">Search Available Students</label>
            </div>
            <input
              className="ui-input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, or RFID"
              disabled={!selectedSectionId}
            />
          </div>
        </div>

        {selectedSection && (
          <p className="admin-page-meta" style={{ marginTop: '1rem' }}>
            Active section: {selectedSection.section_name} | Scheduled {formatSchedule(selectedSection.schedule_time)}
          </p>
        )}
      </section>

      {!selectedSectionId ? (
        <FeedbackBanner
          variant="empty"
          title="No section selected"
          description="Create at least one section first, then return to connect students with enrollments."
        />
      ) : (
        <div className="admin-enrollment-layout">
          <section className="admin-page-note">
            <h3>Enrolled Students</h3>
            <p>These students are currently linked to the selected section.</p>

            <DataTable
              columns={enrolledColumns}
              rows={enrolledRows}
              isLoading={isEnrollmentLoading}
              getRowId={(row) => row.id}
              onDeleteRow={(row) => {
                void handleRemoveStudent(row)
              }}
              emptyState={
                <FeedbackBanner
                  variant="empty"
                  title="No enrolled students"
                  description="Use the available list to connect students to this section."
                />
              }
            />

            {activeRemoveStudentId && (
              <p className="admin-page-meta">Removing student enrollment...</p>
            )}
          </section>

          <section className="admin-page-note">
            <h3>Available Students</h3>
            <p>Students below are not yet enrolled in this section.</p>

            {availableRows.length === 0 ? (
              <FeedbackBanner
                variant="empty"
                title="No available students"
                description="Every listed student is already enrolled or your search returned no match."
              />
            ) : (
              <ul className="admin-enrollment-list">
                {availableRows.map((student) => (
                  <li key={student.id} className="admin-enrollment-item">
                    <div>
                      <p className="admin-enrollment-name">{student.fullName}</p>
                      <p className="admin-enrollment-meta">
                        {student.email} | RFID: {student.rfidUid}
                      </p>
                    </div>
                    <button
                      className="ui-button ui-button--primary"
                      type="button"
                      onClick={() => {
                        void handleEnrollStudent(student.id)
                      }}
                      disabled={
                        Boolean(activeEnrollStudentId) ||
                        Boolean(activeRemoveStudentId)
                      }
                    >
                      {activeEnrollStudentId === student.id
                        ? 'Enrolling...'
                        : 'Enroll'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
