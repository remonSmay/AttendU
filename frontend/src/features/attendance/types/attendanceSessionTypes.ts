export type SessionVerificationMethod = 'RFID' | 'RFID_FACE' | 'MANUAL'

export interface AttendanceSessionCreate {
  section_id: string
  created_by_id: string
  title: string
  start_time: string
  end_time: string
  verification_method: SessionVerificationMethod
}

export interface AttendanceSessionUpdate {
  title?: string
  start_time?: string
  end_time?: string
  is_active?: boolean
  verification_method?: SessionVerificationMethod
}

export interface AttendanceSessionResponse {
  id: string
  created_at: string
  updated_at: string
  section_id: string
  created_by_id: string
  title: string
  start_time: string
  end_time: string
  is_active: boolean
  verification_method: SessionVerificationMethod
  total_students?: number
}

export interface AttendanceSessionHistoryQuery {
  start_date?: string
  end_date?: string
  course_code?: string
}

export interface AttendanceSessionHistoryResponse extends AttendanceSessionResponse {
  section_name?: string
  section?: string
  course_code?: string
  present_count?: number
  present?: number
  attendance_percentage?: number
  percentage?: number
  status?: string
}
