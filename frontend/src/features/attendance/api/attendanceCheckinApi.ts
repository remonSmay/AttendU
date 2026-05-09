import { httpClient } from '../../../api/httpClient'
import { extractApiErrorMessage } from '../../admin/api/adminApiUtils'
import type {
  ManualCheckInPayload,
  ManualCheckInResponse,
  StudentSearchResult,
} from '../types/attendanceCheckinTypes'

export const searchStudents = async (query: string): Promise<StudentSearchResult[]> => {
  try {
    const response = await httpClient.get<StudentSearchResult[]>('/students/search', {
      params: { query },
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to search students.'))
  }
}

export const manualCheckIn = async (
  payload: ManualCheckInPayload,
): Promise<ManualCheckInResponse> => {
  try {
    const response = await httpClient.post<ManualCheckInResponse>('/attendance/check-in', payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to check in student.'))
  }
}
