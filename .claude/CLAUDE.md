# Smart Attendance System - Project Guidelines

## System Overview
- **Type:** Smart Attendance System
- **Verification Methods:** RFID Card + Face Recognition + Manual Entry
- **Hardware:** ESP32 (RFID) + ESP32-CAM (Face Recognition)
- **Backend:** FastAPI (Python) + PostgreSQL (asyncpg) + SQLAlchemy 2.0 ORM
- **Auth:** JWT (access + refresh tokens) with RBAC (admin / instructor)
- **Migration:** Alembic

## Architecture
- `src/main.py` - FastAPI app entry point with lifespan (init_db/close_db)
- `src/helpers/` - config, database, auth utilities, dependencies (RBAC guards)
- `src/Models/` - SQLAlchemy ORM models (User, Student, Course, Section, Enrollment, Device, AttendanceEvent, AttendanceSession, AuditLog)
- `src/Models/schemas/` - Pydantic DTOs for request/response validation
- `src/controllers/` - Business logic layer (base CRUD + specialized controllers)
- `src/routes/` - FastAPI routers (auth, students, courses, sections, devices, attendance_sessions, attendance_checkin)
- `src/alembic/` - Database migrations
- `docker/` - Docker compose for PostgreSQL

## Database Models
- **User**: admin/instructor roles, owns sections and sessions
- **Student**: full_name, email, phone, rfid_uid, face_reference_image
- **Course**: course_name, course_code
- **Section**: links Course + Instructor, has schedule_time
- **Enrollment**: composite PK (student_id, section_id)
- **Device**: device_name, location
- **AttendanceSession**: section_id, created_by_id, title, start/end_time, is_active
- **AttendanceEvent**: student_id, session_id, section_id, device_id, method_used (RFID/FACE/MANUAL), final_status (Present/Absent/Late)
- **AuditLog**: actor_user_id, event_type, action_source, message, metadata_json

## API Prefix
All routes under `/api/v1/`

## Page Requirements
1. **Login Page** - Instructor auth (admin sees all, instructor sees own courses)
2. **Dashboard / Course Selection** - Admin=all courses, Instructor=assigned courses
3. **Attendance Session Page** - Start/stop session, RFID/Face/Manual check-in, real-time display
4. **Students Page** - Student cards with attendance stats, filters, search, export
5. **History & Reports** - Summary cards, attendance records, filters, PDF/Excel export
6. **Analytics Page (Optional)** - Trends, rankings, patterns

## Key Decisions
- ESP32 connects via HTTP REST to backend (RFID reads)
- ESP32-CAM captures photo, sends to backend for face comparison
- Face recognition can use `face_recognition` library (dlib) or `DeepFace` on backend
- Real-time updates via WebSocket (FastAPI native support)
- Student face_reference_image stores file path or base64 reference
