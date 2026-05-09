================================================================================
  SMART ATTENDANCE SYSTEM - PROJECT TODO & IMPLEMENTATION GUIDE
================================================================================

Generated: 2026-03-17
  Stack: FastAPI + PostgreSQL + SQLAlchemy 2.0 + ESP32/ESP32-CAM
================================================================================

================================================================================
  SECTION 1: WHAT IS DONE (Current State)
================================================================================

[x] Database Design & ORM Models
    - User (admin/instructor), Student (rfid_uid + face_reference_image)
    - Course, Section, Enrollment (composite PK)
    - Device, AttendanceEvent, AttendanceSession, AuditLog
    - BaseDataModel mixin (id UUID, created_at, updated_at)
    - Alembic migrations configured and applied

[x] Authentication & Authorization
    - JWT auth (access + refresh tokens) via python-jose + argon2/bcrypt
    - Login (POST /api/v1/auth/login)
    - Register (POST /api/v1/auth/register)
    - Token refresh (POST /api/v1/auth/refresh)
    - Get current user (GET /api/v1/auth/me)
    - RBAC: RequireRole, ensure_admin, ensure_admin_or_instructor
    - Section-level access control (ensure_section_access)
    - Session-level access control (ensure_session_access)

[x] CRUD APIs (all under /api/v1/)
    - Students: create, list, search, get, update, delete
    - Courses: create, list, search, get, update, delete
    - Sections: CRUD + enrollment management
    - Devices: CRUD
    - Attendance Sessions: create, list, list_active, get, update, delete

[x] Attendance Check-In Pipeline
    - POST /api/v1/attendance/check-in
    - Validates: session exists, session active, time window, device exists
    - Validates: student enrolled in section, face similarity threshold (0.75)
    - Prevents duplicate check-ins (unique constraint)
    - Fraud detection with audit logging

[x] Course Dashboard & Analytics
    - GET /api/v1/courses/{id}/dashboard (total students, present/absent, %)
    - GET /api/v1/courses/{id}/students (with attendance %)
    - Weekly and monthly att attendance summaries

[x] Infrastructure
    - Docker Compose for PostgreSQL
    - Pydantic settings (.env support)
    - Async database engine with connection pooling

================================================================================
  SECTION 2: WHAT NEEDS TO BE DONE
================================================================================

----------------------------------------------------------------------

2.1  API STRUCTURE - Missing Endpoints
----------------------------------------------------------------------

PRIORITY: HIGH
  ---------------------------------------------------------------

  A) WebSocket for Real-Time Updates
     -----------------------------------------------------------------
     Route:    WS /api/v1/ws/session/{session_id}
     Purpose:  Push live attendance events to the web dashboard
     Data Sent (server -> client):
       {
         "type": "checkin",
         "student_id": "uuid",
         "student_name": "Ahmed Ali",
         "method": "RFID",
         "status": "Present",
         "timestamp": "2026-03-17T10:30:00Z",
         "total_present": 15,
         "total_students": 30
       }
     Auth:     Validate JWT token as query param: ws://host/ws/session/{id}?token=xxx
     File:     src/routes/ws.py (NEW)
     How:
       1. Create a ConnectionManager class to track active WebSocket connections
       2. On check-in success in attendance_checkin_controller, broadcast to all
          connected clients for that session_id
       3. Use FastAPI native WebSocket support (no extra library needed)

     Example ConnectionManager:
       class ConnectionManager:
           def __init__(self):
               self.active_connections: dict[UUID, list[WebSocket]] = {}

           async def connect(self, session_id: UUID, websocket: WebSocket):
               await websocket.accept()
               self.active_connections.setdefault(session_id, []).append(websocket)

           def disconnect(self, session_id: UUID, websocket: WebSocket):
               self.active_connections[session_id].remove(websocket)

           async def broadcast(self, session_id: UUID, data: dict):
               for connection in self.active_connections.get(session_id, []):
                   await connection.send_json(data)

  B) ESP32 Device Endpoint (RFID Check-In)
     ---------ن--------------------------------------------------------
     Route:    POST /api/v1/devices/checkin
     Purpose:  Lightweight endpoint for ESP32 to send RFID reads
     Auth:     API Key header (X-Device-Key) instead of JWT (devices don't login)
     Request Body:
       {
         "device_id": "uuid",
         "rfid_uid": "A1B2C3D4",
         "attendance_session_id": "uuid"
       }
     Response:
       {
         "accepted": true,
         "student_name": "Ahmed Ali",
         "reason": "attendance recorded"
       }
     Logic:
       1. Validate device API key
       2. Lookup student by rfid_uid
       3. Call existing process_checkin with method_used="RFID"
       4. Return simplified response for ESP32 LCD display

  C) ESP32-CAM Face Capture Endpoint
     -----------------------------------------------------------------
     Route:    POST /api/v1/devices/face-checkin
     Purpose:  Receive photo from ESP32-CAM, run face recognition, check in
     Auth:     API Key header (X-Device-Key)
     Request:  multipart/form-data
       - device_id: str
       - attendance_session_id: str
       - image: UploadFile (JPEG from ESP32-CAM)
     Response:
       {
         "accepted": true,
         "student_name": "Ahmed Ali",
         "similarity_score": 0.89,
         "reason": "face verified and attendance recorded"
       }
     Logic:
       1. Validate device API key
       2. Run face recognition against all enrolled students in the session's section
       3. If match found (score >= 0.75), call process_checkin with method_used="FACE"
       4. Return result

  D) Multi-Check Verification Endpoint (RFID + Face)
     -----------------------------------------------------------------
     Route:    POST /api/v1/devices/multi-check
     Purpose:  Verify attendance using RFID first, then face recognition for the same student
     Auth:     API Key header (X-Device-Key)
     Request:  multipart/form-data
       - device_id: str
       - attendance_session_id: str
       - rfid_uid: str
       - image: UploadFile (JPEG from ESP32-CAM)
     Response:
       {
         "accepted": true,
         "student_name": "Ahmed Ali",
         "rfid_verified": true,
         "face_verified": true,
         "similarity_score": 0.89,
         "reason": "rfid and face verified, attendance recorded"
       }
     Logic:
       1. Validate device API key
       2. Lookup student by rfid_uid
       3. Verify that student is enrolled in the session's section
       4. Compare uploaded face image against that student's registered reference face
       5. Accept check-in only if BOTH checks are true (rfid_verified=true and face_verified=true)
       6. Call process_checkin with method_used="MULTI_CHECK"
       7. Return detailed verification result for device display

  E) Student Face Registration Endpoint
     -----------------------------------------------------------------
     Route:    POST /api/v1/students/{student_id}/face
     Purpose:  Upload reference face photo for a student
     Auth:     JWT (admin only)
     Request:  multipart/form-data with image file
     Logic:
       1. Save image to disk: /media/faces/{student_id}.jpg
       2. Pre-compute face encoding and cache it (pickle or numpy file)
       3. Update student.face_reference_image = file path
     Response: { "message": "face registered", "file_path": "..." }

  F) Reports / Export Endpoints
     -----------------------------------------------------------------
     Route:    GET /api/v1/reports/attendance?course_id=X&date_from=Y&date_to=Z
     Purpose:  Attendance records with filters
     Response: Paginated list of session summaries

     Route:    GET /api/v1/reports/export?format=pdf|excel&course_id=X
     Purpose:  Download PDF or Excel attendance report
     Libraries: openpyxl (Excel), reportlab or weasyprint (PDF)

  G) Student Attendance History
     -----------------------------------------------------------------
     Route:    GET /api/v1/students/{student_id}/attendance
     Purpose:  Full attendance history for one student across all courses
     Response: List of { session_title, course_name, date, status, method }

PRIORITY: MEDIUM
  ---------------------------------------------------------------

  H) Enrollment Bulk Import
     Route:    POST /api/v1/sections/{section_id}/enroll-bulk
     Purpose:  Upload CSV of student IDs to enroll
     Request:  multipart/form-data with CSV file

  I) Analytics Endpoints (Optional Page)
     Route:    GET /api/v1/analytics/trends?course_id=X
     Route:    GET /api/v1/analytics/rankings?course_id=X
     Route:    GET /api/v1/analytics/patterns?course_id=X

----------------------------------------------------------------------

2.2  COMPLETE API ROUTE MAP (Current + Planned)
----------------------------------------------------------------------

  AUTH
    POST   /api/v1/auth/register              [DONE]
    POST   /api/v1/auth/login                  [DONE]
    POST   /api/v1/auth/refresh                [DONE]
    GET    /api/v1/auth/me                     [DONE]

  STUDENTS
    POST   /api/v1/students/                   [DONE]
    GET    /api/v1/students/                   [DONE]
    GET    /api/v1/students/search             [DONE]
    GET    /api/v1/students/{id}               [DONE]
    PUT    /api/v1/students/{id}               [DONE]
    DELETE /api/v1/students/{id}               [DONE]
    POST   /api/v1/students/{id}/face          [TODO] face registration
    GET    /api/v1/students/{id}/attendance     [TODO] attendance history

  COURSES
    POST   /api/v1/courses/                    [DONE]
    GET    /api/v1/courses/                    [DONE]
    GET    /api/v1/courses/search              [DONE]
    GET    /api/v1/courses/{id}                [DONE]
    PUT    /api/v1/courses/{id}                [DONE]
    DELETE /api/v1/courses/{id}                [DONE]
    GET    /api/v1/courses/{id}/students       [DONE]
    GET    /api/v1/courses/{id}/dashboard      [DONE]

  SECTIONS
    POST   /api/v1/sections/                   [DONE]
    GET    /api/v1/sections/                   [DONE]
    GET    /api/v1/sections/{id}               [DONE]
    PUT    /api/v1/sections/{id}               [DONE]
    DELETE /api/v1/sections/{id}               [DONE]
    POST   /api/v1/sections/{id}/enroll        [DONE]
    POST   /api/v1/sections/{id}/enroll-bulk   [TODO] CSV import

  DEVICES
    POST   /api/v1/devices/                    [DONE]
    GET    /api/v1/devices/                    [DONE]
    GET    /api/v1/devices/{id}                [DONE]
    PUT    /api/v1/devices/{id}                [DONE]
    DELETE /api/v1/devices/{id}                [DONE]
    POST   /api/v1/devices/checkin             [TODO] ESP32 RFID check-in
    POST   /api/v1/devices/face-checkin        [TODO] ESP32-CAM face check-in
    POST   /api/v1/devices/multi-check         [TODO] RFID + Face dual verification

  ATTENDANCE SESSIONS
    POST   /api/v1/attendance-sessions/        [DONE]
    GET    /api/v1/attendance-sessions/        [DONE]
    GET    /api/v1/attendance-sessions/active   [DONE]
    GET    /api/v1/attendance-sessions/{id}     [DONE]
    PUT    /api/v1/attendance-sessions/{id}     [DONE]
    DELETE /api/v1/attendance-sessions/{id}     [DONE]

  ATTENDANCE CHECK-IN
    POST   /api/v1/attendance/check-in         [DONE]

  WEBSOCKET
    WS     /api/v1/ws/session/{session_id}     [TODO] real-time updates

  REPORTS
    GET    /api/v1/reports/attendance           [TODO] filtered records
    GET    /api/v1/reports/export               [TODO] PDF/Excel export

  ANALYTICS (OPTIONAL)
    GET    /api/v1/analytics/trends             [TODO]
    GET    /api/v1/analytics/rankings           [TODO]
    GET    /api/v1/analytics/patterns           [TODO]

================================================================================
  SECTION 3: REAL-TIME CONNECTION WITH WEB (WebSocket)
================================================================================

  WHY WebSocket?

- HTTP polling wastes bandwidth and adds latency
- WebSocket gives instant push when a student checks in
- FastAPI has built-in WebSocket support (no extra library)

  ARCHITECTURE:
  ┌─────────────┐    HTTP POST     ┌──────────────┐    broadcast    ┌──────────────┐
  │   ESP32      │ ──────────────> │   FastAPI     │ ────────────> │  Web Browser  │
  │  (RFID/CAM)  │   /devices/     │   Backend     │   WebSocket    │  (Dashboard)  │
  └─────────────┘   checkin        └──────────────┘                └──────────────┘

  FLOW:

  1. Instructor opens Attendance Session page in browser
  2. Browser connects: ws://server/api/v1/ws/session/{session_id}?token=JWT
  3. Server validates JWT, adds connection to ConnectionManager
  4. ESP32 sends RFID → POST /api/v1/devices/checkin
  5. Backend validates + saves → broadcasts via WebSocket to all connected clients
  6. Browser receives JSON → updates student list in real-time
  7. When session ends, server closes all WebSocket connections

  IMPLEMENTATION FILES:

- src/routes/ws.py (NEW) - WebSocket route + ConnectionManager
- src/controllers/crud/attendance_checkin_controller.py (MODIFY) - add broadcast call
- src/routes/base.py (MODIFY) - include ws_router

  CONNECTION MANAGER CODE LOCATION: src/helpers/ws_manager.py (NEW)

  CLIENT SIDE (JavaScript):
    const ws = new WebSocket(`ws://server/api/v1/ws/session/${sessionId}?token=${jwt}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Update UI: add student to present list, update counters
    };

================================================================================
  SECTION 4: HOW TO CONNECT ESP32 WITH BACKEND
================================================================================

  HARDWARE SETUP:

- ESP32 (with RFID-RC522 module) → reads RFID cards
- ESP32-CAM (with OV2640 camera) → captures face photos
- Both connect to WiFi and communicate with backend via HTTP

  ---------------------------------------------------------------

4.1  ESP32 + RFID (Card Reading)
  ---------------------------------------------------------------

  CONNECTION DIAGRAM:
    ESP32 Pin    →  RC522 Pin
    GPIO 5       →  SDA (SS)
    GPIO 18      →  SCK
    GPIO 23      →  MOSI
    GPIO 19      →  MISO
    GPIO 22      →  RST
    3.3V         →  3.3V
    GND          →  GND

  ESP32 CODE FLOW (Arduino/PlatformIO):
    1. Connect to WiFi
    2. Read RFID card UID (e.g., "A1B2C3D4")
    3. Send HTTP POST to backend:

       POST http://<server-ip>:8000/api/v1/devices/checkin
       Headers:
         Content-Type: application/json
         X-Device-Key: <device-api-key>
       Body:
         {
           "device_id": "uuid-of-this-device",
           "rfid_uid": "A1B2C3D4",
           "attendance_session_id": "uuid-of-active-session"
         }

    4. Parse response JSON
    5. Display result on LCD/LED:
       - Green LED + "Present" if accepted
       - Red LED + "Rejected" if not

  DATA TYPE FROM ESP32:
    - rfid_uid: String (hex), e.g., "A1B2C3D4" (4-7 bytes as hex)
    - device_id: String (UUID, hardcoded or stored in EEPROM)
    - attendance_session_id: String (UUID, received from server or set by instructor)

  HOW ESP32 GETS THE SESSION ID:
    Option A (Simple): Instructor sets session_id in ESP32 via serial/web config page
    Option B (Better): ESP32 calls GET /api/v1/attendance-sessions/active
                       and picks the session for its assigned section
    Option C (Best):   Backend assigns device to section; ESP32 auto-fetches active session

  ---------------------------------------------------------------

4.2  ESP32-CAM (Face Capture)
  ---------------------------------------------------------------

  ESP32-CAM CODE FLOW:
    1. Connect to WiFi
    2. Initialize camera (OV2640)
    3. Capture JPEG photo (resolution: 640x480 or 320x240 for speed)
    4. Send HTTP POST as multipart/form-data:

       POST http://<server-ip>:8000/api/v1/devices/face-checkin
       Headers:
         X-Device-Key: <device-api-key>
       Body (multipart/form-data):
         - device_id: "uuid-of-this-device"
         - attendance_session_id: "uuid"
         - image: <JPEG binary data>

    5. Parse response JSON
    6. Display result on serial/connected LCD

  DATA TYPE FROM ESP32-CAM:
    - image: Binary JPEG (typically 10-50 KB at 320x240)
    - device_id: String (UUID)
    - attendance_session_id: String (UUID)

  TRIGGERING CAPTURE:
    Option A: Button press on ESP32-CAM
    Option B: Motion/proximity sensor triggers capture
    Option C: Continuous capture every N seconds while session is active

================================================================================
  SECTION 5: FACE RECOGNITION LAYER
================================================================================

  ---------------------------------------------------------------

5.1  Library Choice (Recommended: face_recognition)
  ---------------------------------------------------------------

  Library: face_recognition (built on dlib)
  Install: pip install face_recognition
  Why:
    - Simple API (3 functions: load, encode, compare)
    - Good accuracy for controlled environments (indoor, frontal view)
    - Works on CPU (no GPU required for small-to-medium scale)

  Alternative: DeepFace (uses multiple backends: VGG-Face, Facenet, ArcFace)
    - More accurate but heavier
    - Use if face_recognition accuracy is not enough

  ---------------------------------------------------------------

5.2  Face Registration Flow
  ---------------------------------------------------------------

  Admin uploads student photo → Backend processes it:

    1. Receive image via POST /api/v1/students/{id}/face
    2. Save original: /media/faces/{student_id}.jpg
    3. Compute face encoding:
         import face_recognition
         image = face_recognition.load_image_file("path.jpg")
         encodings = face_recognition.face_encodings(image)
         if not encodings:
             raise ValueError("No face detected in image")
         encoding = encodings[0]  # 128-dimensional numpy array
    4. Save encoding: /media/faces/{student_id}.npy (numpy file)
       OR save as pickle: /media/faces/{student_id}.pkl
    5. Update DB: student.face_reference_image = "/media/faces/{student_id}.jpg"

  ---------------------------------------------------------------

5.3  Face Verification Flow (During Check-In)
  ---------------------------------------------------------------

  ESP32-CAM sends photo → Backend compares:

    1. Receive image via POST /api/v1/devices/face-checkin
    2. Get all enrolled students for the session's section
    3. Load their pre-computed encodings from /media/faces/*.npy
    4. Encode the received photo:
         unknown_image = face_recognition.load_image_file(uploaded_file)
         unknown_encoding = face_recognition.face_encodings(unknown_image)
    5. Compare against all enrolled students:
         for student_id, known_encoding in enrolled_encodings.items():
             results = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.5)
             distance = face_recognition.face_distance([known_encoding], unknown_encoding)
             similarity = 1 - distance[0]  # Convert distance to similarity
             if results[0] and similarity >= 0.75:
                 # MATCH FOUND
                 break
    6. If match: call process_checkin(method_used="FACE", similarity_score=similarity)
    7. If no match: return { "accepted": false, "reason": "face not recognized" }

  ---------------------------------------------------------------

5.4  Performance Optimization
  ---------------------------------------------------------------

  Problem: Loading face encodings from disk for every check-in is slow
  Solution: Cache in memory

    # On server startup or when session starts:
    # Load all enrolled student encodings into a dict
    face_cache: dict[UUID, np.ndarray] = {}

    # When student registers face → update cache
    # When session starts → pre-load enrolled students' encodings

  For 30-50 students per section, comparison takes <100ms on CPU.

================================================================================
  SECTION 6: FULL INTEGRATION FLOW
================================================================================

  ┌─────────────────────────────────────────────────────────────────┐
  │                    COMPLETE SYSTEM FLOW                         │
  └─────────────────────────────────────────────────────────────────┘

  1. SETUP PHASE (Admin)
     a. Create Course → Create Section → Assign Instructor
     b. Create Students (with rfid_uid)
     c. Enroll Students in Sections
     d. Upload face photos for each student (POST /students/{id}/face)
     e. Register Devices (ESP32 + ESP32-CAM)

  2. SESSION PHASE (Instructor)
     a. Instructor logs in → sees assigned courses
     b. Clicks course → creates Attendance Session (start/end time)
     c. Session page opens WebSocket connection for real-time updates

  3. CHECK-IN PHASE (Devices)
     RFID Flow:
       ESP32 reads card → POST /devices/checkin { rfid_uid } →
       Backend: lookup student → validate enrollment → save event →
       WebSocket broadcast → Dashboard updates live

     Face Flow:
       ESP32-CAM captures photo → POST /devices/face-checkin { image } →
       Backend: encode face → compare with enrolled students →
       If match: save event → WebSocket broadcast → Dashboard updates
       If no match: return error → ESP32-CAM shows red LED

     Manual Flow:
       Instructor searches student on dashboard → clicks "Mark Present" →
       POST /attendance/check-in { method: "MANUAL" } →
       Save event → Dashboard updates

  4. END PHASE
     a. Instructor clicks "Stop Session" → PUT session.is_active = false
     b. No more check-ins accepted
     c. WebSocket connections closed
     d. View/export attendance report

================================================================================
  SECTION 7: FILE STRUCTURE FOR NEW CODE
================================================================================

  src/
  ├── helpers/
  │   ├── ws_manager.py          [NEW] WebSocket ConnectionManager
  │   ├── device_auth.py         [NEW] API key validation for ESP32 devices
  │   └── face_service.py        [NEW] Face recognition logic
  ├── routes/
  │   ├── ws.py                  [NEW] WebSocket route
  │   └── device_endpoints.py    [NEW] ESP32-specific endpoints (/devices/checkin, /face-checkin, /multi-check)
  ├── controllers/crud/
  │   ├── face_controller.py     [NEW] Face registration + verification
  │   └── report_controller.py   [NEW] Reports + export logic
  ├── Models/schemas/
  │   ├── device_checkin.py      [NEW] Schemas for ESP32 check-in requests
  │   └── report.py              [NEW] Schemas for report responses
  └── media/
      └── faces/                 [NEW] Student face images + encodings

================================================================================
  SECTION 8: SUGGESTED IMPLEMENTATION ORDER (SIMPLE PATH)
================================================================================

PHASE 1: Core Missing Features (Backend)
  ---------------------------------------------------------------

  [ ] 1. Add Device API Key authentication (src/helpers/device_auth.py)
         - Add api_key column to Device model
         - Create dependency: validate_device_key()
  [ ] 2. Create ESP32 RFID check-in endpoint (POST /devices/checkin)
         - Lookup student by rfid_uid
         - Reuse existing process_checkin logic
  [ ] 3. Add WebSocket support for real-time updates
         - ConnectionManager class
         - WS route with JWT auth
         - Broadcast on successful check-in
  [ ] 4. Test RFID flow end-to-end with Postman

PHASE 2: Face Recognition
  ---------------------------------------------------------------

  [ ] 5. Install face_recognition library
  [ ] 6. Create face service (encode, compare functions)
  [ ] 7. Create student face registration endpoint
  [ ] 8. Create ESP32-CAM face check-in endpoint
  [ ] 9. Create multi-check endpoint (POST /devices/multi-check)
         - First verify RFID student match
         - Then verify uploaded face against the same RFID-identified student
         - Accept only if both checks are true
  [ ] 10. Add face encoding cache for performance
  [ ] 11. Test face + multi-check flow end-to-end

PHASE 3: Reports & Export
  ---------------------------------------------------------------

  [ ] 12. Student attendance history endpoint
  [ ] 13. Filtered attendance report endpoint
  [ ] 14. PDF/Excel export (openpyxl + reportlab)

PHASE 4: ESP32 Firmware
  ---------------------------------------------------------------

  [ ] 15. ESP32 + RFID Arduino code (WiFi + HTTP + MFRC522)
  [ ] 16. ESP32-CAM Arduino code (WiFi + HTTP + Camera)
  [ ] 17. Integration testing with real hardware

PHASE 5: Frontend (Optional / Separate Project)
  ---------------------------------------------------------------

  [ ] 18. Choose framework (React / Next.js / Vue)
  [ ] 19. Login page
  [ ] 20. Dashboard + Course selection
  [ ] 21. Attendance session page with WebSocket
  [ ] 22. Students page with filters
  [ ] 23. Reports page with export

================================================================================
  SECTION 9: ASSESSMENT - ARE WE DOING THE RIGHT THING?
================================================================================

  WHAT IS GOOD:

- Database schema is well-designed and covers all relationships
- RBAC with admin/instructor roles is properly implemented
- Attendance validation pipeline has comprehensive checks:
  - Session exists, active, within time window
  - Device registered, student enrolled
  - Face similarity threshold, duplicate prevention
  - Audit logging for fraud detection
- Generic CRUD base controller reduces code duplication
- Async throughout (asyncpg + SQLAlchemy async)
- Course dashboard with weekly/monthly summaries already works
- Pydantic schemas provide good input validation

  WHAT NEEDS ATTENTION:
  ! No WebSocket yet - critical for real-time attendance display
  ! No ESP32-specific endpoints - current check-in requires full JWT auth
    (ESP32 devices should use simpler API key auth)
  ! face_reference_image field exists in Student model but no face
    recognition logic is implemented yet
  ! No file upload handling for face photos
  ! No report export functionality (PDF/Excel)
  ! No frontend exists yet
  ! CORS not configured (will be needed for frontend)
  ! Device model has no api_key field for device authentication
  ! list_courses returns ALL courses even for instructors (should filter
    by instructor's sections)

  OVERALL VERDICT:
  The backend foundation is SOLID. The database design, auth system, and
  check-in validation pipeline are well-built. You are on the RIGHT track.
  The main gap is the hardware integration layer (ESP32 endpoints, device
  auth, face recognition) and real-time features (WebSocket). These are
  the next logical steps.

================================================================================
 