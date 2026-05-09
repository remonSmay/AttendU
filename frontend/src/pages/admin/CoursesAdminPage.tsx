import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import type { AdminTopBarConfig } from '../../components/admin/AdminShell'
import AdminFormModal from '../../components/admin/AdminFormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import DataTable, { type DataTableColumn } from '../../components/admin/DataTable'
import TableToolbar from '../../components/admin/TableToolbar'
import FeedbackBanner from '../../components/ui/FeedbackBanner'
import {
  createCourseAdmin,
  deleteCourseAdmin,
  listCoursesAdmin,
  updateCourseAdmin,
} from '../../features/admin/api/coursesAdminApi'
import { listSectionsAdmin } from '../../features/admin/api/sectionsAdminApi'
import type { CourseApiResponse, CourseApiUpsertPayload } from '../../features/admin/types/adminApiTypes'
import type { CourseAdminRow, CourseFormPayload } from '../../features/admin/types/adminContracts'
import { useSnackbar } from '../../hooks/useSnackbar'
import { useAdminPageConfig } from './useAdminPageConfig'
import './AdminPages.css'

const initialCourseForm: CourseFormPayload = {
  courseName: '',
  courseCode: '',
  description: '',
}

const toCoursePayload = (formState: CourseFormPayload): CourseApiUpsertPayload => ({
  course_name: formState.courseName.trim(),
  course_code: formState.courseCode.trim(),
})

const toCourseRow = (
  course: CourseApiResponse,
  sectionCountByCourseId: Record<string, number>,
  instructorCountByCourseId: Record<string, number>,
): CourseAdminRow => ({
  id: course.id,
  courseName: course.course_name,
  courseCode: course.course_code,
  sectionCount: sectionCountByCourseId[course.id] ?? 0,
  instructorCount: instructorCountByCourseId[course.id] ?? 0,
})

const createSectionCountMap = (
  sections: Array<{ course_id: string }>,
): Record<string, number> => {
  const map: Record<string, number> = {}
  for (const section of sections) {
    map[section.course_id] = (map[section.course_id] ?? 0) + 1
  }
  return map
}

const createInstructorCountMap = (
  sections: Array<{ course_id: string; instructor_id: string }>,
): Record<string, number> => {
  const map: Record<string, Set<string>> = {}
  for (const section of sections) {
    if (!map[section.course_id]) map[section.course_id] = new Set()
    map[section.course_id].add(section.instructor_id)
  }
  return Object.fromEntries(
    Object.entries(map).map(([courseId, instructors]) => [courseId, instructors.size]),
  )
}

export default function CoursesAdminPage() {
  const [rows, setRows] = useState<CourseAdminRow[]>([])
  const [coursesById, setCoursesById] = useState<Record<string, CourseApiResponse>>({})
  const [sectionCountByCourseId, setSectionCountByCourseId] = useState<Record<string, number>>({})
  const [instructorCountByCourseId, setInstructorCountByCourseId] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CourseFormPayload>(initialCourseForm)
  const [selectedCourse, setSelectedCourse] = useState<CourseAdminRow | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  
  const { showSnackbar } = useSnackbar()

  const syncCourseIntoState = useCallback(
    (course: CourseApiResponse) => {
      const nextRow = toCourseRow(course, sectionCountByCourseId, instructorCountByCourseId)

      setRows((currentRows) => {
        const existingIndex = currentRows.findIndex((row) => row.id === nextRow.id)

        if (existingIndex === -1) {
          return [nextRow, ...currentRows]
        }

        const updatedRows = [...currentRows]
        updatedRows[existingIndex] = nextRow
        return updatedRows
      })

      setCoursesById((current) => ({
        ...current,
        [course.id]: course,
      }))
    },
    [sectionCountByCourseId, instructorCountByCourseId],
  )

  const removeCourseFromState = useCallback((courseId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== courseId))
    setCoursesById((current) => {
      const next = { ...current }
      delete next[courseId]
      return next
    })
  }, [])

  const loadCourses = useCallback(async () => {
    setIsLoading(true)
    setFeedbackError(null)

    try {
      const [courses, sections] = await Promise.all([
        listCoursesAdmin(),
        listSectionsAdmin(),
      ])

      const nextSectionCountByCourseId = createSectionCountMap(sections)
      const nextInstructorCountByCourseId = createInstructorCountMap(sections)
      setSectionCountByCourseId(nextSectionCountByCourseId)
      setInstructorCountByCourseId(nextInstructorCountByCourseId)
      setRows(
        courses.map((course) =>
          toCourseRow(course, nextSectionCountByCourseId, nextInstructorCountByCourseId),
        ),
      )
      setCoursesById(
        Object.fromEntries(courses.map((course) => [course.id, course])),
      )
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to load courses.',
      )
      setRows([])
      setCoursesById({})
      setSectionCountByCourseId({})
      setInstructorCountByCourseId({})
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCourses()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadCourses])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setFormState(initialCourseForm)
    setIsFormOpen(true)
    setFormError(null)
  }, [])

  const pageConfig = useMemo<AdminTopBarConfig>(
    () => ({
      title: 'Courses',
      description: 'Manage course catalog data, codes, and related sections inside the shared control panel.',
      primaryActionLabel: 'Add Course',
      onPrimaryAction: openCreateModal,
      isPrimaryActionLoading: isSubmitting,
    }),
    [isSubmitting, openCreateModal],
  )

  useAdminPageConfig(pageConfig)

  const columns = useMemo<DataTableColumn<CourseAdminRow>[]>(
    () => [
      { id: 'courseName', header: 'Course', cell: (row) => row.courseName },
      { id: 'courseCode', header: 'Code', cell: (row) => row.courseCode },
      { id: 'sectionCount', header: 'Sections', align: 'center', cell: (row) => row.sectionCount },
      { id: 'instructorCount', header: 'Instructors', align: 'right', cell: (row) => row.instructorCount },
    ],
    [],
  )

  const handleEdit = useCallback((row: CourseAdminRow) => {
    const sourceCourse = coursesById[row.id]

    setEditingId(row.id)
    setFormState({
      courseName: sourceCourse?.course_name ?? row.courseName,
      courseCode: sourceCourse?.course_code ?? row.courseCode,
      description: '',
    })
    setFormError(null)
    setIsFormOpen(true)
  }, [coursesById])

  const handleDelete = useCallback((row: CourseAdminRow) => {
    setSelectedCourse(row)
    setIsDeleteOpen(true)
  }, [])

  const handleFormSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      const payload = toCoursePayload(formState)
      const savedCourse = editingId
        ? await updateCourseAdmin(editingId, payload)
        : await createCourseAdmin(payload)

      syncCourseIntoState(savedCourse)
      setIsFormOpen(false)
      setEditingId(null)
      setFormState(initialCourseForm)
      showSnackbar(editingId ? 'Course updated successfully.' : 'Course created successfully.', 'success')
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to save course.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [editingId, formState, syncCourseIntoState, showSnackbar])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedCourse) {
      return
    }

    setIsDeleting(true)
    setFormError(null)

    try {
      await deleteCourseAdmin(selectedCourse.id)
      removeCourseFromState(selectedCourse.id)
      setSelectedCourse(null)
      setIsDeleteOpen(false)
      showSnackbar('Course deleted successfully.', 'success')
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to delete course.',
        'error'
      )
    } finally {
      setIsDeleting(false)
    }
  }, [removeCourseFromState, selectedCourse, showSnackbar])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const query = searchQuery.toLowerCase()
    return rows.filter(row => 
      row.courseName.toLowerCase().includes(query) || 
      row.courseCode.toLowerCase().includes(query)
    )
  }, [rows, searchQuery])

  return (
    <div className="admin-page-stack">
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search courses by name or code..."
      />

      {feedbackError && (
        <FeedbackBanner 
          variant="error" 
          title="Data loading failed" 
          description={feedbackError} 
          actionLabel="Retry" 
          onAction={() => void loadCourses()} 
        />
      )}

      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
        emptyState={
          <FeedbackBanner
            variant="empty"
            title={searchQuery ? 'No courses found' : 'No courses loaded'}
            description={searchQuery ? 'Try adjusting your search criteria.' : 'Create the first course to get started.'}
            actionLabel={searchQuery ? undefined : 'Add Course'}
            onAction={searchQuery ? undefined : openCreateModal}
          />
        }
      />

      <AdminFormModal
        isOpen={isFormOpen}
        title={editingId ? 'Update Course' : 'Create Course'}
        description="Maintain the core course details used by dashboards, sections, and analytics."
        submitLabel={editingId ? 'Save Course' : 'Create Course'}
        isSubmitting={isSubmitting}
        errorMessage={formError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      >
        <div className="admin-form-grid">
          <div className="ui-field">
            <label className="ui-field__label">Course Name</label>
            <input
              className="ui-input"
              value={formState.courseName}
              onChange={(event) => setFormState((current) => ({ ...current, courseName: event.target.value }))}
              placeholder="e.g. Introduction to Computer Science"
              required
            />
          </div>

          <div className="ui-field">
            <label className="ui-field__label">Course Code</label>
            <input
              className="ui-input"
              value={formState.courseCode}
              onChange={(event) => setFormState((current) => ({ ...current, courseCode: event.target.value }))}
              placeholder="e.g. CS101"
              required
            />
          </div>

          <div className="ui-field admin-field-span-2">
            <label className="ui-field__label">Description</label>
            <textarea
              className="ui-textarea"
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              placeholder="Provide a brief overview of the course content..."
            />
          </div>
        </div>
      </AdminFormModal>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Course"
        message={`Delete ${selectedCourse?.courseName ?? 'this course'} from the course catalog?`}
        confirmLabel="Delete Course"
        isConfirming={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
