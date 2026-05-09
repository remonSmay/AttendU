import { httpClient } from '../../../api/httpClient'
import type {
  SectionApiResponse,
  SectionApiUpsertPayload,
  StudentApiResponse,
} from '../types/adminApiTypes'
import { extractApiErrorMessage } from './adminApiUtils'

export const listSectionsAdmin = async (): Promise<SectionApiResponse[]> => {
  try {
    const response = await httpClient.get<SectionApiResponse[]>('/sections')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch sections.'))
  }
}

export const createSectionAdmin = async (
  payload: SectionApiUpsertPayload,
): Promise<SectionApiResponse> => {
  try {
    const response = await httpClient.post<SectionApiResponse>('/sections', payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to create section.'))
  }
}

export const updateSectionAdmin = async (
  sectionId: string,
  payload: SectionApiUpsertPayload,
): Promise<SectionApiResponse> => {
  try {
    const response = await httpClient.put<SectionApiResponse>(`/sections/${sectionId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update section.'))
  }
}

export const deleteSectionAdmin = async (sectionId: string): Promise<void> => {
  try {
    await httpClient.delete(`/sections/${sectionId}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete section.'))
  }
}

export const listSectionStudentsAdmin = async (
  sectionId: string,
): Promise<StudentApiResponse[]> => {
  try {
    const response = await httpClient.get<StudentApiResponse[]>(
      `/sections/${sectionId}/students`,
    )
    return response.data
  } catch (error) {
    throw new Error(
      extractApiErrorMessage(error, 'Failed to fetch enrolled students.'),
    )
  }
}

export const enrollStudentToSectionAdmin = async (
  sectionId: string,
  studentId: string,
): Promise<StudentApiResponse> => {
  try {
    const response = await httpClient.post<StudentApiResponse>(
      `/sections/${sectionId}/students/${studentId}`,
    )
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to enroll student.'))
  }
}

export const removeStudentFromSectionAdmin = async (
  sectionId: string,
  studentId: string,
): Promise<void> => {
  try {
    await httpClient.delete(`/sections/${sectionId}/students/${studentId}`)
  } catch (error) {
    throw new Error(
      extractApiErrorMessage(error, 'Failed to remove student from section.'),
    )
  }
}
