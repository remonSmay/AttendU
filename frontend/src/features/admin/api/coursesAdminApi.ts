import { httpClient } from '../../../api/httpClient'
import type { CourseApiResponse, CourseApiUpsertPayload } from '../types/adminApiTypes'
import { extractApiErrorMessage } from './adminApiUtils'

export const listCoursesAdmin = async (): Promise<CourseApiResponse[]> => {
  try {
    const response = await httpClient.get<CourseApiResponse[]>('/courses')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch courses.'))
  }
}

export const createCourseAdmin = async (
  payload: CourseApiUpsertPayload,
): Promise<CourseApiResponse> => {
  try {
    const response = await httpClient.post<CourseApiResponse>('/courses', payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to create course.'))
  }
}

export const updateCourseAdmin = async (
  courseId: string,
  payload: CourseApiUpsertPayload,
): Promise<CourseApiResponse> => {
  try {
    const response = await httpClient.put<CourseApiResponse>(`/courses/${courseId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update course.'))
  }
}

export const deleteCourseAdmin = async (courseId: string): Promise<void> => {
  try {
    await httpClient.delete(`/courses/${courseId}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete course.'))
  }
}
