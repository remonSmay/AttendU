# Admin Endpoint Mapping (Integration Phase)

This scaffold intentionally does not call APIs. These mappings are the planned wiring targets.

- Students page:
  - GET /students
  - POST /students
  - PUT /students/{student_id}
  - DELETE /students/{student_id}

- Courses page:
  - GET /courses
  - POST /courses
  - PUT /courses/{course_id}
  - DELETE /courses/{course_id}

- Sections page:
  - GET /sections
  - POST /sections
  - PUT /sections/{section_id}
  - DELETE /sections/{section_id}

- Devices page:
  - GET /devices
  - POST /devices
  - PUT /devices/{device_id}
  - DELETE /devices/{device_id}

- Enrollments page (now wired):
  - GET /sections
  - GET /students
  - GET /sections/{section_id}/students
  - POST /sections/{section_id}/students/{student_id}
  - DELETE /sections/{section_id}/students/{student_id}
