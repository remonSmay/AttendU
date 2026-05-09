export interface StudentSearchResult {
  id: string
  full_name: string
  rfid_uid: string
}

export interface ManualCheckInPayload {
  student_id: string
  attendance_session_id: string
  section_id: string
  device_id: string
  method_used: 'MANUAL'
}

export interface ManualCheckInAttendanceEvent {
  student_id: string
  attendance_session_id: string
  section_id: string
  device_id: string
  method_used: 'RFID' | 'FACE' | 'MANUAL'
  final_status: 'Present' | 'Absent' | 'Late'
  created_at: string
  updated_at: string
}

export interface ManualCheckInResponse {
  accepted: boolean
  reason: string
  checked_at: string
  attendance_event?: ManualCheckInAttendanceEvent | null
}
