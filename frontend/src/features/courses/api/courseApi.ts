import { isAxiosError } from 'axios'

import { httpClient } from '../../../api/httpClient'
import type {
  CourseDashboardResponse,
  CourseResponse,
  CourseStudentAttendanceResponse,
} from '../types/courseTypes'

const extractApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (isAxiosError<{ detail?: string }>(error)) {
    if (typeof error.response?.data?.detail === 'string') {
      return error.response.data.detail
    }
  }

  return fallbackMessage
}

export const getCourses = async (): Promise<CourseResponse[]> => {
  try {
    const response = await httpClient.get<CourseResponse[]>('/courses')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch courses.'))
  }
}

export const searchCourses = async (query: string): Promise<CourseResponse[]> => {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return getCourses()
  }

  try {
    const response = await httpClient.get<CourseResponse[]>('/courses/search', {
      params: { query: trimmedQuery },
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to search courses.'))
  }
}

export const getCourse = async (courseId: string): Promise<CourseResponse> => {
  try {
    const response = await httpClient.get<CourseResponse>(`/courses/${courseId}`)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch course.'))
  }
}

export const getCourseStudents = async (
  courseId: string,
): Promise<CourseStudentAttendanceResponse[]> => {
  try {
    const response = await httpClient.get<CourseStudentAttendanceResponse[]>(
      `/courses/${courseId}/students`,
    )
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch course students.'))
  }
}

export type {
  CourseDashboardResponse,
  CourseResponse,
  CourseStudentAttendanceResponse,
}

export const getCourseDashboard = async (courseId: string): Promise<CourseDashboardResponse> => {
  try {
    const response = await httpClient.get<CourseDashboardResponse>(`/courses/${courseId}/dashboard`)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch course dashboard.'))
  }
}

export const exportCourseAttendance = async (
  courseId: string,
  format: 'excel' | 'pdf' = 'excel',
): Promise<void> => {
  try {
    const response = await httpClient.get(`/reports/export`, {
      params: { course_id: courseId, format },
      responseType: 'blob',
    })

    const blob = new Blob([response.data], {
      type:
        format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `attendance_report_${courseId}_${new Date().toISOString().split('T')[0]}.${
        format === 'excel' ? 'xlsx' : 'pdf'
      }`,
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to export attendance report.'))
  }
}
