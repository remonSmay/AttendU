import { httpClient } from '../../../api/httpClient'
import type { StudentApiResponse, StudentApiUpsertPayload } from '../types/adminApiTypes'
import { extractApiErrorMessage } from './adminApiUtils'

const STUDENTS_ENDPOINT = '/students'

export type StudentResponse = StudentApiResponse

export interface StudentCreate {
  full_name: string
  email: string
  phone?: string | null
  rfid_uid: string
  face_reference_image?: string | null
}

export const getStudents = async (
  offset: number = 0,
  limit: number = 50,
): Promise<StudentResponse[]> => {
  try {
    const response = await httpClient.get<StudentResponse[]>(STUDENTS_ENDPOINT, {
      params: { offset, limit },
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch students.'))
  }
}

export const searchStudents = async (query: string): Promise<StudentResponse[]> => {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return getStudents()
  }

  try {
    const response = await httpClient.get<StudentResponse[]>(`${STUDENTS_ENDPOINT}/search`, {
      params: { query: trimmedQuery },
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to search students.'))
  }
}

export const getStudent = async (id: string): Promise<StudentResponse> => {
  try {
    const response = await httpClient.get<StudentResponse>(`${STUDENTS_ENDPOINT}/${id}`)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch student.'))
  }
}

export const createStudent = async (payload: StudentCreate): Promise<StudentResponse> => {
  try {
    const response = await httpClient.post<StudentResponse>(STUDENTS_ENDPOINT, payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to create student.'))
  }
}

export const updateStudent = async (
  id: string,
  payload: Partial<StudentCreate>,
): Promise<StudentResponse> => {
  try {
    const response = await httpClient.put<StudentResponse>(`${STUDENTS_ENDPOINT}/${id}`, payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update student.'))
  }
}

export const deleteStudent = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`${STUDENTS_ENDPOINT}/${id}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete student.'))
  }
}

export const listStudentsAdmin = async (): Promise<StudentResponse[]> => getStudents()

export const createStudentAdmin = async (
  payload: StudentApiUpsertPayload,
): Promise<StudentResponse> => createStudent(payload)

export const updateStudentAdmin = async (
  studentId: string,
  payload: StudentApiUpsertPayload,
): Promise<StudentResponse> => updateStudent(studentId, payload)

export const deleteStudentAdmin = async (studentId: string): Promise<void> =>
  deleteStudent(studentId)

export const registerStudentFaceAdmin = async (
  studentId: string,
  image: File,
): Promise<StudentResponse> => {
  try {
    const formData = new FormData()
    formData.append('image', image)

    const response = await httpClient.post<StudentResponse>(
      `${STUDENTS_ENDPOINT}/${studentId}/face`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to register student face.'))
  }
}
