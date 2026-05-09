import { httpClient } from '../../../api/httpClient'
import { extractApiErrorMessage } from '../../admin/api/adminApiUtils'
import type {
  AttendanceSessionCreate,
  AttendanceSessionHistoryQuery,
  AttendanceSessionHistoryResponse,
  AttendanceSessionResponse,
  AttendanceSessionUpdate,
} from '../types/attendanceSessionTypes'

const ATTENDANCE_SESSIONS_ENDPOINT = '/attendance-sessions'

export const getActiveSessions = async (): Promise<AttendanceSessionResponse[]> => {
  try {
    const response =
      await httpClient.get<AttendanceSessionResponse[]>(`${ATTENDANCE_SESSIONS_ENDPOINT}/active`)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch active sessions.'))
  }
}

export const getAttendanceSessionsHistory = async (
  query: AttendanceSessionHistoryQuery = {},
): Promise<AttendanceSessionHistoryResponse[]> => {
  try {
    const response = await httpClient.get<AttendanceSessionHistoryResponse[]>(
      ATTENDANCE_SESSIONS_ENDPOINT,
      {
        params: query,
      },
    )
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch attendance history.'))
  }
}

export const createSession = async (
  payload: AttendanceSessionCreate,
): Promise<AttendanceSessionResponse> => {
  try {
    const response = await httpClient.post<AttendanceSessionResponse>(
      ATTENDANCE_SESSIONS_ENDPOINT,
      payload,
    )
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to create attendance session.'))
  }
}

export const updateSession = async (
  id: string,
  payload: AttendanceSessionUpdate,
): Promise<AttendanceSessionResponse> => {
  try {
    const response = await httpClient.put<AttendanceSessionResponse>(
      `${ATTENDANCE_SESSIONS_ENDPOINT}/${id}`,
      payload,
    )
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update attendance session.'))
  }
}

export const stopSession = async (id: string): Promise<AttendanceSessionResponse> => {
  try {
    const response = await httpClient.post<AttendanceSessionResponse>(
      `${ATTENDANCE_SESSIONS_ENDPOINT}/${id}/stop`,
    )
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to stop attendance session.'))
  }
}

export const deleteSession = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`${ATTENDANCE_SESSIONS_ENDPOINT}/${id}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete attendance session.'))
  }
}

export const preloadSessionFaces = async (id: string): Promise<{ message: string, total_enrolled: number, faces_loaded: number }> => {
  try {
    const response = await httpClient.post<{ message: string, total_enrolled: number, faces_loaded: number }>(
      `${ATTENDANCE_SESSIONS_ENDPOINT}/${id}/preload-faces`
    )
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to pre-load face encodings.'))
  }
}

export type {
  AttendanceSessionCreate,
  AttendanceSessionHistoryQuery,
  AttendanceSessionHistoryResponse,
  AttendanceSessionResponse,
}
